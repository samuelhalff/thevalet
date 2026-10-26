#!/usr/bin/env node
/**
 * Build-time content & i18n validator (runs in `prebuild`). Locales: fr (default) and en.
 *
 * FAIL:
 *  - UI and page-copy key parity between fr and en (src/i18n/{fr,en}.json, pages.*.json, legal.*.json),
 *    arrays compared by index, no empty strings, no email addresses
 *  - every t(locale, "key") literal in app/ and src/ resolves to a string in both locales
 *  - content frontmatter (content/<locale>/{services,journal}/<slug>.md): required fields, well-formed;
 *    services: 5–8 FAQs; every published page exists in both locales (translationKey)
 *  - depth: main-content word count of every indexable page ≥ its minimum (see MIN_WORDS)
 *  - titles ≤ 60 chars (with the " | The Valet" suffix) and descriptions ≤ 155 chars, unique per locale
 *  - internal links (markdown bodies, frontmatter answers/FAQs, page copy): the route exists, the
 *    "#fragment" exists on the target page, FR pages link to /fr/… and EN pages to /en/…, anchors are
 *    descriptive (no "cliquez ici" / "en savoir plus" / "click here" / "learn more" alone)
 *  - internal linking: every service page links in its body to ≥ 3 other services and to the request
 *    page with its own ?service=<key>; every service page receives ≥ 3 incoming content links;
 *    every indexable page has ≥ 3 incoming links (content + header/footer navigation)
 *  - no "TODO" / "lorem" in published content
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { anchorIds, slugify } from "./lib/heading-id.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["fr", "en"];
const COLLECTIONS = ["services", "journal"];
const SITE_SUFFIX = " | The Valet";
const PILLARS = ["chalets", "alpine-transfers"];

/** Minimum main-content words (FR master; EN mirrors and may run ~10% shorter). */
const MIN_WORDS = {
  service: { fr: 900, en: 800 },
  pillar: { fr: 1500, en: 1350 },
  home: { fr: 900, en: 800 },
  about: { fr: 600, en: 540 },
  faq: { fr: 900, en: 800 },
  hub: { fr: 300, en: 270 },
};
const MIN_FAQ_PAGE_ITEMS = 22;

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for future non-fatal checks
const warn = (msg) => warnings.push(msg);
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));

// ---------- 1. i18n parity ----------
const dicts = Object.fromEntries(LOCALES.map((l) => [l, readJson(`src/i18n/${l}.json`)]));
const pages = Object.fromEntries(LOCALES.map((l) => [l, readJson(`src/i18n/pages.${l}.json`)]));
const legal = Object.fromEntries(LOCALES.map((l) => [l, readJson(`src/i18n/legal.${l}.json`)]));
const routesJson = readJson("src/lib/static-routes.json").pages;

function flatten(obj, prefix = "", out = new Map()) {
  if (Array.isArray(obj)) obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
  else if (obj && typeof obj === "object") for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  else out.set(prefix, obj);
  return out;
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+|mailto:/i;
for (const [name, tree] of [["", dicts], ["pages.", pages], ["legal.", legal]]) {
  const flat = Object.fromEntries(LOCALES.map((l) => [l, flatten(tree[l])]));
  for (const l of LOCALES) {
    for (const other of LOCALES) {
      if (other === l) continue;
      for (const key of flat[l].keys()) if (!flat[other].has(key)) fail(`i18n: "${key}" exists in ${name}${l}.json but is missing in ${name}${other}.json`);
    }
    for (const [key, value] of flat[l]) {
      if (typeof value !== "string" || value.trim() === "") fail(`i18n: "${key}" in ${name}${l}.json is empty or not a string`);
      else if (EMAIL_RE.test(value)) fail(`i18n: "${key}" in ${name}${l}.json contains an email address (contact details come from config)`);
    }
  }
}

// ---------- 2. t() literal keys used in code ----------
function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!/node_modules|\.next/.test(p)) walk(p, acc);
    } else if (/\.(tsx?|jsx?|mjs)$/.test(e.name) && !/\.test\./.test(e.name)) acc.push(p);
  }
  return acc;
}
const lookup = (obj, key) => key.split(".").reduce((cur, k) => (cur && typeof cur === "object" ? cur[k] : undefined), obj);
const tCall = /\bt\(\s*[A-Za-z_$][\w$.]*\s*,\s*["'`]([A-Za-z0-9_.-]+)["'`]\s*\)/g;
let tCount = 0;
for (const file of [...walk(path.join(ROOT, "app")), ...walk(path.join(ROOT, "src"))]) {
  const src = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);
  const keys = new Set();
  for (const m of src.matchAll(tCall)) keys.add(m[1]);
  for (const m of src.matchAll(/(?:altKey|captionKey):\s*["'`]([^"'`]+)["'`]/g)) keys.add(m[1]);
  for (const key of keys) {
    tCount++;
    for (const l of LOCALES) if (typeof lookup(dicts[l], key) !== "string") fail(`i18n: ${rel} uses key "${key}" which is missing in ${l}.json`);
  }
}

// ---------- 3. content ----------
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const content = []; // { locale, collection, slug, data, body, file, draft }
const today = new Date().toISOString().slice(0, 10);
const isoOf = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v);

for (const locale of LOCALES) {
  for (const collection of COLLECTIONS) {
    const dir = path.join(ROOT, "content", locale, collection);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md"))) {
      const file = path.join(dir, f);
      const rel = path.relative(ROOT, file);
      let parsed;
      try {
        parsed = matter(fs.readFileSync(file, "utf8"));
      } catch (e) {
        fail(`content: ${rel} has invalid frontmatter (${e.message})`);
        continue;
      }
      const data = parsed.data;
      const publishAt = isoOf(data.publishAt);
      if (publishAt && !ISO.test(String(publishAt))) fail(`content: ${rel} "publishAt" must be YYYY-MM-DD`);
      if (publishAt && String(publishAt) > today) continue;
      const updated = isoOf(data.updated);
      const slug = data.slug || f.replace(/\.md$/, "");
      const required = ["title", "description", "translationKey", "updated"];
      if (collection === "services") required.push("summary", "serviceType", "delivery", "answer");
      for (const field of required) if (!data[field]) fail(`content: ${rel} is missing frontmatter "${field}"`);
      if (updated && !ISO.test(String(updated))) fail(`content: ${rel} "updated" must be YYYY-MM-DD`);
      if (slug !== f.replace(/\.md$/, "")) fail(`content: ${rel} slug "${slug}" must match the file name`);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail(`content: ${rel} slug "${slug}" must be lower-case-kebab`);
      if (collection === "services") {
        if (typeof data.order !== "number") fail(`content: ${rel} "order" must be a number`);
        if (!["partner", "coordinated"].includes(data.delivery)) fail(`content: ${rel} "delivery" must be partner | coordinated`);
        const n = Array.isArray(data.faq) ? data.faq.length : 0;
        if (n < 5 || n > 8) fail(`content: ${rel} needs 5–8 FAQ items (has ${n})`);
        if (/^#\s/m.test(parsed.content)) fail(`content: ${rel} body must not contain an H1 (the title is the H1)`);
      }
      if (data.sources !== undefined && !Array.isArray(data.sources)) fail(`content: ${rel} "sources" must be an array of {label, url}`);
      (data.sources ?? []).forEach((s, i) => {
        if (!s?.label || !/^https?:\/\//.test(s?.url ?? "")) fail(`content: ${rel} sources[${i}] needs label and absolute url`);
      });
      if (data.keywords !== undefined) {
        const kw = data.keywords;
        if (!kw || typeof kw.primary !== "string" || !kw.primary.trim()) fail(`content: ${rel} keywords.primary must be a non-empty string`);
        if (!Array.isArray(kw?.secondary) || kw.secondary.some((k) => typeof k !== "string" || !k.trim())) fail(`content: ${rel} keywords.secondary must be an array of non-empty strings`);
      }
      if (data.faq !== undefined) {
        if (!Array.isArray(data.faq)) fail(`content: ${rel} "faq" must be an array of {q, a}`);
        else data.faq.forEach((q, i) => (!q?.q || !q?.a) && fail(`content: ${rel} faq[${i}] needs q and a`));
      }
      content.push({ locale, collection, slug, data, body: parsed.content, file: rel, draft: data.draft === true });
    }
  }
}

const published = content.filter((c) => !c.draft);
const byKey = new Map();
for (const c of published) {
  const k = `${c.collection}:${c.data.translationKey}`;
  if (!byKey.has(k)) byKey.set(k, new Set());
  byKey.get(k).add(c.locale);
}
for (const [k, locs] of byKey) {
  const missing = LOCALES.filter((l) => !locs.has(l));
  const single = published.some((c) => `${c.collection}:${c.data.translationKey}` === k && c.data.singleLocale === true);
  if (missing.length && !single) fail(`content: ${k} has no published version in: ${missing.join(", ")}`);
}
const seenKeys = new Set();
for (const c of content) {
  const k = `${c.locale}:${c.collection}:${c.data.translationKey}`;
  if (seenKeys.has(k)) fail(`content: duplicate translationKey "${c.data.translationKey}" in ${c.locale}/${c.collection}`);
  seenKeys.add(k);
}
for (const c of published) {
  const text = `${JSON.stringify(c.data)}\n${c.body}`;
  if (/\bTODO\b/.test(text)) fail(`content: ${c.file} contains "TODO"`);
  if (/lorem/i.test(text)) fail(`content: ${c.file} contains "lorem"`);
}

// ---------- 4. pages, routes, words, titles ----------
/** Indexable pages: id → { locale, path, title, description, absoluteTitle, words, minWords, texts[], anchors, kind } */
const LINK_RE = /\[([^\]]+)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const plain = (s) => String(s).replace(LINK_RE, "$1").replace(/\{\/?em\}/g, "").replace(/[#*_>`|-]+/g, " ");
const countWords = (...parts) => parts.flat(Infinity).map(plain).join(" ").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const strings = (v, out = []) => {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
};

const pagesById = new Map();
const lp = (locale, p) => `/${locale}${p === "/" ? "/" : p}`;
const journalCount = Object.fromEntries(LOCALES.map((l) => [l, published.filter((c) => c.locale === l && c.collection === "journal").length]));

for (const locale of LOCALES) {
  const pc = pages[locale];
  const lc = legal[locale];
  const fixed = {
    home: { meta: pc.home, texts: strings(pc.home), min: MIN_WORDS.home, absoluteTitle: true },
    services: { meta: pc.servicesHub, texts: strings(pc.servicesHub), min: MIN_WORDS.hub, words: countWords(pc.servicesHub.intro, pc.servicesHub.paragraphs) },
    journal: { meta: pc.journal, texts: strings(pc.journal), min: MIN_WORDS.hub, words: countWords(pc.journal.intro, pc.journal.paragraphs), noindex: journalCount[locale] === 0 },
    about: { meta: pc.about, texts: strings(pc.about), min: MIN_WORDS.about },
    faq: { meta: pc.faq, texts: strings(pc.faq), min: MIN_WORDS.faq },
    contact: { meta: pc.contact, texts: strings(pc.contact) },
    request: { meta: pc.request, texts: strings(pc.request) },
    privacy: { meta: lc.privacy, texts: strings(lc.privacy) },
    legal: { meta: lc.legal, texts: strings(lc.legal) },
    terms: { meta: lc.terms, texts: strings(lc.terms) },
  };
  for (const [key, def] of Object.entries(fixed)) {
    const route = routesJson[key];
    if (!route) {
      fail(`routes: static-routes.json has no "${key}"`);
      continue;
    }
    const words = def.words ?? countWords(def.texts.filter((s) => s !== def.meta.metaTitle && s !== def.meta.metaDescription));
    pagesById.set(`${locale}:${key}`, {
      id: `${locale}:${key}`,
      locale,
      path: lp(locale, route[locale]),
      title: def.meta.metaTitle,
      description: def.meta.metaDescription,
      absoluteTitle: !!def.absoluteTitle,
      words,
      minWords: def.min?.[locale] ?? 0,
      texts: def.texts,
      anchors: new Set(key === "faq" ? pc.faq.groups.map((g) => slugify(g.title)) : (def.meta.sections ?? []).map((s) => slugify(s.h))),
      indexable: !def.noindex,
      kind: "fixed",
    });
  }
  if (pc.faq.groups.reduce((n, g) => n + g.items.length, 0) < MIN_FAQ_PAGE_ITEMS) fail(`depth: ${locale} FAQ page needs ≥ ${MIN_FAQ_PAGE_ITEMS} Q&As`);
}

const base = { services: "services", journal: "journal" };
for (const c of content) {
  const faqText = (c.data.faq ?? []).flatMap((f) => [f.q, f.a]);
  const pillar = c.collection === "services" && PILLARS.includes(c.data.translationKey);
  pagesById.set(`${c.locale}:${c.collection}:${c.data.translationKey}`, {
    id: `${c.locale}:${c.collection}:${c.data.translationKey}`,
    locale: c.locale,
    path: `/${c.locale}/${base[c.collection]}/${c.slug}/`,
    title: c.data.title,
    description: c.data.description,
    absoluteTitle: false,
    words: countWords(c.data.answer ?? "", c.body, faqText),
    minWords: c.collection === "services" ? (pillar ? MIN_WORDS.pillar : MIN_WORDS.service)[c.locale] : 0,
    texts: [c.data.answer ?? "", c.body, ...faqText.filter((_, i) => i % 2 === 1)],
    anchors: anchorIds(c.body),
    indexable: !c.draft,
    kind: c.collection,
    entry: c,
  });
}

const routeByPath = new Map([...pagesById.values()].map((p) => [p.path, p]));
const extraRoutes = new Set(["/", "/sitemap.xml", "/robots.txt", "/llms.txt"]);

// titles & descriptions
for (const locale of LOCALES) {
  const seenTitle = new Map();
  const seenDesc = new Map();
  for (const p of [...pagesById.values()].filter((x) => x.locale === locale && x.indexable)) {
    const full = p.absoluteTitle ? p.title : `${p.title}${SITE_SUFFIX}`;
    if (full.length > 60) fail(`seo: ${p.path} title is ${full.length} chars (> 60): "${full}"`);
    if (!p.description) fail(`seo: ${p.path} has no meta description`);
    else if (p.description.length > 155) fail(`seo: ${p.path} description is ${p.description.length} chars (> 155)`);
    if (seenTitle.has(full)) fail(`seo: duplicate title "${full}" on ${p.path} and ${seenTitle.get(full)}`);
    if (seenDesc.has(p.description)) fail(`seo: duplicate description on ${p.path} and ${seenDesc.get(p.description)}`);
    seenTitle.set(full, p.path);
    seenDesc.set(p.description, p.path);
  }
}

// word counts
for (const p of pagesById.values()) {
  if (p.indexable && p.minWords && p.words < p.minWords) fail(`depth: ${p.path} has ${p.words} words of main content (minimum ${p.minWords})`);
}

// ---------- 5. internal links ----------
const BAD_ANCHOR = /^(ici|cliquez ici|en savoir plus|lire la suite|plus|here|click here|learn more|read more|more)$/i;
const incoming = new Map([...pagesById.keys()].map((k) => [k, new Set()]));
const outgoing = new Map([...pagesById.keys()].map((k) => [k, new Set()]));

for (const p of pagesById.values()) {
  for (const text of p.texts) {
    for (const m of String(text).matchAll(LINK_RE)) {
      const [, label, href] = m;
      if (/^(https?:|mailto:|tel:)/.test(href)) continue;
      if (BAD_ANCHOR.test(label.trim())) fail(`links: ${p.path} uses a non-descriptive anchor "${label}"`);
      if (href.startsWith("#")) {
        if (!p.anchors.has(href.slice(1))) fail(`links: ${p.path} links to "${href}", which is not an id on this page`);
        continue;
      }
      if (!href.startsWith("/")) {
        fail(`links: ${p.path} uses relative link "${href}"`);
        continue;
      }
      const [pathPart, frag] = href.split("#");
      let target = pathPart.split("?")[0];
      if (!/\.[a-z0-9]+$/i.test(target) && !target.endsWith("/")) target += "/";
      if (!target.startsWith(`/${p.locale}/`)) fail(`links: ${p.path} (${p.locale}) links to another language: "${href}"`);
      const dest = routeByPath.get(target);
      if (!dest) {
        if (!extraRoutes.has(target)) fail(`links: ${p.path} links to "${href}", which is not a route`);
        continue;
      }
      if (frag && !dest.anchors.has(frag)) fail(`links: ${p.path} links to "${href}", but that page has no id "${frag}"`);
      const query = pathPart.split("?")[1];
      if (query && dest.id.endsWith(":request")) {
        const key = new URLSearchParams(query).get("service");
        if (key && !published.some((c) => c.collection === "services" && c.data.translationKey === key)) fail(`links: ${p.path} prefills unknown service "${key}"`);
      }
      if (dest.id !== p.id) {
        incoming.get(dest.id).add(p.id);
        outgoing.get(p.id).add(dest.id);
      }
    }
  }
}

// service pages: in-body links to ≥ 3 services + own request link; ≥ 3 incoming content links
for (const p of pagesById.values()) {
  if (p.kind !== "services" || !p.indexable) continue;
  const c = p.entry;
  const linkedServices = new Set();
  let requestLink = false;
  for (const m of c.body.matchAll(LINK_RE)) {
    const href = m[2];
    const svc = /^\/(fr|en)\/services\/([a-z0-9-]+)\//.exec(href);
    if (svc && svc[2] !== c.slug) linkedServices.add(svc[2]);
    const req = routesJson.request[c.locale];
    if (href.startsWith(`/${c.locale}${req}`) && new URLSearchParams(href.split("?")[1] ?? "").get("service") === c.data.translationKey) requestLink = true;
  }
  if (linkedServices.size < 3) fail(`links: ${p.path} body links to ${linkedServices.size} other service pages (minimum 3)`);
  if (!requestLink) fail(`links: ${p.path} body has no link to the request page with ?service=${c.data.translationKey}`);
  if (incoming.get(p.id).size < 3) fail(`links: ${p.path} has ${incoming.get(p.id).size} incoming content links (minimum 3)`);
}

// every indexable page: ≥ 3 incoming links, counting site navigation (header/footer link every
// service, the pillars, the house pages and the legal pages from every page).
const navTargets = new Set(
  [...pagesById.values()].filter((p) => p.kind === "services" || p.kind === "fixed").map((p) => p.id),
);
const pageCountByLocale = Object.fromEntries(LOCALES.map((l) => [l, [...pagesById.values()].filter((p) => p.locale === l).length]));
for (const p of pagesById.values()) {
  if (!p.indexable) continue;
  const nav = navTargets.has(p.id) ? pageCountByLocale[p.locale] - 1 : 0;
  const total = Math.max(incoming.get(p.id).size, nav);
  if (total < 3) fail(`links: ${p.path} is (nearly) orphaned: ${total} incoming links (minimum 3)`);
}

// ---------- report ----------
for (const w of warnings) console.warn(`⚠️  ${w}`);
if (process.argv.includes("--report")) {
  console.log("\npage | words | min | incoming (content) | outgoing (content)");
  for (const p of [...pagesById.values()].sort((a, b) => a.path.localeCompare(b.path))) {
    console.log(`${p.path} | ${p.words} | ${p.minWords || "-"} | ${incoming.get(p.id).size} | ${outgoing.get(p.id).size}${p.indexable ? "" : " (noindex)"}`);
  }
}
if (errors.length) {
  console.error(`\n❌ Content validation failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✅ Content valid: ${flatten(dicts.fr).size} UI keys × ${LOCALES.length} locales, ${tCount} code key references, ${content.length} content files (${content.filter((c) => c.draft).length} drafts), ${pagesById.size} pages.`,
);
