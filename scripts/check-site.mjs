#!/usr/bin/env node
/**
 * Post-build check of the static export in out/ (runs in `postbuild`). Reads the real HTML.
 *
 * FAIL:
 *  - exactly one <h1> per page; <title> ≤ 60 chars and unique per locale; meta description present,
 *    ≤ 155 chars, unique per locale; self-referencing canonical; og:image and twitter:image present
 *  - every <img> has an alt attribute
 *  - every internal <a href> resolves to a built page (or file); in-content links (<main>) of a FR page
 *    point to /fr/… and of an EN page to /en/… (language switcher links are outside <main>)
 *  - every indexable page has ≥ 3 incoming internal links from other pages
 *  - with NEXT_PUBLIC_NOINDEX=true every page carries a robots noindex meta
 * Prints a per-page table (words in <main>, incoming, outgoing) with --report.
 * Also removes the placeholder pages generated for empty collections (/<locale>/journal/_/).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "out");
const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === "true";
const errors = [];
const fail = (m) => errors.push(m);

if (!fs.existsSync(OUT)) {
  console.error("check-site: out/ not found (run next build first)");
  process.exit(1);
}

for (const l of ["fr", "en"]) fs.rmSync(path.join(OUT, l, "journal", "_"), { recursive: true, force: true });

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "_next") walk(p, acc);
    } else acc.push(p);
  }
  return acc;
}

const files = walk(OUT);
const htmlPages = files.filter((f) => f.endsWith("index.html")).map((f) => "/" + path.relative(OUT, path.dirname(f)).split(path.sep).join("/") + "/").map((p) => p.replace(/^\/\/$/, "/"));
const fileSet = new Set(files.map((f) => "/" + path.relative(OUT, f).split(path.sep).join("/")));
const pageSet = new Set(htmlPages);

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}="([^"]*)"`, "i").exec(tag);
  return m ? decode(m[1]) : undefined;
};

const pages = new Map();
for (const p of htmlPages) {
  const html = fs.readFileSync(path.join(OUT, p, "index.html"), "utf8");
  const locale = /^\/(fr|en)\//.exec(p)?.[1];
  const robots = [...html.matchAll(/<meta[^>]+name="robots"[^>]*>/gi)].map((m) => attr(m[0], "content") ?? "").join(",");
  const title = decode(/<title>([^<]*)<\/title>/i.exec(html)?.[1] ?? "");
  const description = attr(/<meta[^>]+name="description"[^>]*>/i.exec(html)?.[0] ?? "", "content") ?? "";
  const canonical = attr(/<link[^>]+rel="canonical"[^>]*>/i.exec(html)?.[0] ?? "", "href") ?? "";
  const main = /<main[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] ?? "";
  const words = main
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(decode(w))).length;
  const links = [...html.matchAll(/<a\s[^>]*>/gi)].map((m) => attr(m[0], "href")).filter(Boolean);
  const mainLinks = [...main.matchAll(/<a\s[^>]*>/gi)].map((m) => attr(m[0], "href")).filter(Boolean);
  pages.set(p, {
    path: p,
    html,
    locale,
    noindex: /noindex/i.test(robots),
    title,
    description,
    canonical,
    words,
    links,
    mainLinks,
    h1: (html.match(/<h1[\s>]/gi) ?? []).length,
    imgsWithoutAlt: [...html.matchAll(/<img\s[^>]*>/gi)].filter((m) => attr(m[0], "alt") === undefined).length,
    og: /property="og:image"/.test(html) && /name="twitter:image"/.test(html),
  });
}

const normalize = (href) => {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  let p = href.split(/[?#]/)[0];
  if (!/\.[a-z0-9]+$/i.test(p) && !p.endsWith("/")) p += "/";
  return p;
};

const incoming = new Map([...pages.keys()].map((k) => [k, new Set()]));
const outgoing = new Map([...pages.keys()].map((k) => [k, new Set()]));
const contentPages = [...pages.values()].filter((p) => p.locale);

for (const pg of contentPages) {
  for (const href of pg.links) {
    const target = normalize(href);
    if (!target) continue;
    if (!pageSet.has(target) && !fileSet.has(target)) {
      fail(`links: ${pg.path} → ${href} does not exist in the build`);
      continue;
    }
    if (target !== pg.path && pages.has(target)) {
      incoming.get(target).add(pg.path);
      outgoing.get(pg.path).add(target);
    }
  }
  for (const href of pg.mainLinks) {
    const target = normalize(href);
    if (target && target !== "/" && !/\.[a-z0-9]+$/i.test(target) && !target.startsWith(`/${pg.locale}/`)) {
      fail(`links: ${pg.path} (${pg.locale}) links in its content to another language: ${href}`);
    }
  }
}

const seen = { title: new Map(), description: new Map() };
for (const pg of contentPages) {
  if (pg.h1 !== 1) fail(`html: ${pg.path} has ${pg.h1} <h1> elements (expected 1)`);
  if (pg.imgsWithoutAlt) fail(`html: ${pg.path} has ${pg.imgsWithoutAlt} <img> without alt`);
  if (NOINDEX && !pg.noindex) fail(`html: ${pg.path} is missing robots noindex while NEXT_PUBLIC_NOINDEX=true`);
  const isPlaceholder = /404|introuvable|not found/i.test(pg.title);
  if (isPlaceholder) continue;
  if (pg.title.length > 60) fail(`seo: ${pg.path} <title> is ${pg.title.length} chars: "${pg.title}"`);
  if (!pg.description || pg.description.length > 155) fail(`seo: ${pg.path} meta description is ${pg.description.length} chars`);
  if (!pg.canonical.endsWith(pg.path)) fail(`seo: ${pg.path} canonical is "${pg.canonical}"`);
  if (!pg.og) fail(`seo: ${pg.path} lacks og:image / twitter:image`);
  for (const k of ["title", "description"]) {
    const key = `${pg.locale}|${pg[k]}`;
    if (seen[k].has(key)) fail(`seo: duplicate ${k} on ${pg.path} and ${seen[k].get(key)}`);
    seen[k].set(key, pg.path);
  }
  const indexableIntent = !/\/journal\/$/.test(pg.path); // empty journal index is noindex by design
  if (indexableIntent && incoming.get(pg.path).size < 3) fail(`links: ${pg.path} has ${incoming.get(pg.path).size} incoming links (minimum 3)`);
}

if (process.argv.includes("--report")) {
  console.log("\npage | words(main) | incoming | outgoing");
  for (const pg of contentPages.sort((a, b) => a.path.localeCompare(b.path))) {
    console.log(`${pg.path} | ${pg.words} | ${incoming.get(pg.path).size} | ${outgoing.get(pg.path).size}`);
  }
}
if (errors.length) {
  console.error(`\n❌ Site check failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✅ Site check: ${contentPages.length} pages, one H1 each, titles/descriptions unique, links resolve.`);
