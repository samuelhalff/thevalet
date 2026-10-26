#!/usr/bin/env node
/**
 * Guardrails for a newly generated journal article (FR source + EN translation). Run after
 * scripts/ai-article.mjs.
 *
 *   node scripts/validate-new-article.mjs --slug <slug> [--discard-on-fail] [--skip-site-validator] [--skip-url-check]
 *
 * Without --slug it reads the slug from the run state file (AI_ARTICLE_STATE, written by the
 * generator). Checks: frontmatter, meta lengths, word count, structure, internal links, source
 * policy, wording rules (pricing, social proof, emails, guarantees, UNVERIFIED), keyword
 * placement, FR/EN number parity, every number grounded in the fact base, the full
 * `node scripts/validate-content.mjs`, and finally a reachability re-check of every cited source
 * and external body link (skip with --skip-url-check, e.g. offline). Exit 1 with the reasons if
 * anything fails; with --discard-on-fail the article files are deleted so nothing can be
 * committed.
 *
 * STUB (The Valet): the fact base, categories and CTA target are stubs in
 * scripts/lib/article-pipeline.mjs, so a real article will not pass until they are written.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  LOCALES,
  SOURCE_LOCALE,
  articlePath,
  buildAllowedLinks,
  checkArticle,
  checkArticleSet,
  buildFactIndex,
  extractLinks,
  loadFactSources,
  readArticle,
  stripUnverified,
  unverifiedOnlyNumbers,
} from "./lib/article-pipeline.mjs";
import { checkUrls } from "./lib/url-check.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const STATE_FILE = process.env.AI_ARTICLE_STATE || path.join(os.tmpdir(), "ai-article-state.json");

export function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}

export function runSiteValidator(root = ROOT) {
  const r = spawnSync(process.execPath, [path.join(root, "scripts", "validate-content.mjs")], { cwd: root, encoding: "utf8" });
  return { ok: r.status === 0, output: `${r.stdout ?? ""}${r.stderr ?? ""}`.trim() };
}

/**
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateNewArticle(slug, { root = ROOT, researchFacts = [], siteValidator = true } = {}) {
  const errors = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? "")) return { ok: false, errors: [`invalid slug "${slug}"`] };
  const articles = {};
  for (const locale of LOCALES) {
    const a = readArticle(root, locale, slug);
    if (!a) {
      errors.push(`${locale}: ${path.relative(root, articlePath(root, locale, slug))} is missing`);
      continue;
    }
    articles[locale] = a;
  }
  if (!articles[SOURCE_LOCALE]) return { ok: false, errors };
  const facts = loadFactSources(root); // STUB: empty until the fact base exists
  const factIndex = buildFactIndex(researchCorpus(stripUnverified(facts), researchFacts));
  for (const locale of Object.keys(articles)) {
    const allowedLinks = new Set(buildAllowedLinks(root, locale).map((l) => l.url));
    errors.push(...checkArticle(articles[locale], { locale, slug, allowedLinks, factIndex }));
  }
  errors.push(...checkArticleSet(articles, { factIndex, unverifiedNumbers: unverifiedOnlyNumbers(facts) }));

  if (siteValidator) {
    const site = runSiteValidator(root);
    if (!site.ok) errors.push(`validate-content.mjs failed:\n${site.output}`);
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Grounding corpus: the fact base plus the verbatim evidence quotes of verified research facts.
 * The model's own paraphrase (`claim`) never counts as evidence; facts without a quote are ignored.
 */
export function researchCorpus(factBaseText, researchFacts = []) {
  const quotes = (Array.isArray(researchFacts) ? researchFacts : []).map((f) => (typeof f?.quote === "string" ? f.quote : "")).filter(Boolean);
  return `${factBaseText}\n${quotes.join("\n")}`;
}

/** Every cited source and external body link of the article set (all locales). */
export function articleUrls(root, slug) {
  const urls = [];
  for (const locale of LOCALES) {
    const a = readArticle(root, locale, slug);
    if (!a) continue;
    for (const s of Array.isArray(a.data.sources) ? a.data.sources : []) if (s?.url) urls.push(String(s.url));
    urls.push(...extractLinks(a.body).external);
  }
  return [...new Set(urls)];
}

export function discardArticle(slug, root = ROOT) {
  for (const locale of LOCALES) {
    const file = articlePath(root, locale, slug);
    if (fs.existsSync(file)) fs.rmSync(file);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const arg = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const state = readState();
  const slug = arg("--slug") || state?.slug;
  if (!slug) {
    console.error("❌ No slug given (--slug) and no run state found.");
    process.exit(1);
  }
  const researchFacts = state?.slug === slug ? (state.researchFacts ?? []) : [];
  const { errors } = validateNewArticle(slug, { researchFacts, siteValidator: !args.includes("--skip-site-validator") });
  if (!args.includes("--skip-url-check") && !errors.some((e) => e.includes("is missing"))) {
    const r = await checkUrls(articleUrls(ROOT, slug));
    for (const w of r.warnings) console.warn(`⚠️  ${w}`);
    errors.push(...r.errors.map((e) => `source/link: ${e}`));
  }
  if (!errors.length) {
    console.log(`✅ ${slug}: all guardrails passed (FR/EN)`);
    return;
  }
  console.error(`❌ ${slug}: ${errors.length} guardrail failure(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  if (args.includes("--discard-on-fail")) {
    discardArticle(slug);
    console.error(`🗑️  Discarded content/{fr,en}/journal/${slug}.md`);
  }
  process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  });
}
