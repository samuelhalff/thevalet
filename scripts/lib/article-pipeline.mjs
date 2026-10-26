/**
 * Pure(ish) building blocks of the automated journal pipeline (The Valet, thevalet.ch):
 * backlog + topic picker, allowed internal links, fact-base excerpts, number normalisation
 * and parity, and the article guardrails. Used by scripts/ai-article.mjs and
 * scripts/validate-new-article.mjs; unit-tested in scripts/lib/pipeline.test.mjs.
 *
 * Locales: FR is the source language (drafted first), EN is translated from it.
 * Output: content/<locale>/journal/<slug>.md (one file per locale, same slug).
 *
 * STUB (The Valet): the editorial brief, the fact base, the category list, the CTA target and
 * the topic-specific wording rules are still to be written before the pipeline is re-enabled —
 * see the header note of .github/workflows/ai-articles.yml. Everything marked "STUB" below.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { classifySource } from "./source-policy.mjs";
import { startsWithLowercase } from "./title-case.mjs";

/** Source language first: the article is drafted in FR and translated to EN. */
export const SOURCE_LOCALE = "fr";
export const LOCALES = ["fr", "en"];
export const TARGET_LOCALES = LOCALES.filter((l) => l !== SOURCE_LOCALE);
export const COLLECTION = "journal";
const PRIORITY_DEFAULT = 9;

// ---------------------------------------------------------------------------
// Backlog and topic selection
// ---------------------------------------------------------------------------

export function loadBacklog(root) {
  return JSON.parse(fs.readFileSync(path.join(root, "content", "backlog.json"), "utf8"));
}

export function saveBacklog(root, backlog) {
  fs.writeFileSync(path.join(root, "content", "backlog.json"), `${JSON.stringify(backlog, null, 2)}\n`);
}

export function existingArticleSlugs(root, locale = SOURCE_LOCALE) {
  const dir = path.join(root, "content", locale, COLLECTION);
  if (!fs.existsSync(dir)) return new Set();
  return new Set(fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")));
}

/** Category of the most recently generated article (backlog history, newest last). */
export function lastGeneratedCategory(backlog) {
  const history = Array.isArray(backlog.history) ? backlog.history : [];
  if (history.length) return history[history.length - 1].category ?? null;
  const done = (backlog.items ?? []).filter((i) => i.status === "done" && i.doneAt);
  done.sort((a, b) => String(a.doneAt).localeCompare(String(b.doneAt)));
  return done.length ? done[done.length - 1].category : null;
}

/**
 * Pick the next topic.
 * - slugOverride: that item (any status except done-and-existing), bypassing priority and diversity.
 * - otherwise: status "todo", slug not already in content/fr/journal, sorted by priority (1 first)
 *   then backlog order; never the same category as the last generated article unless every
 *   remaining candidate shares it (then the rule is relaxed and the reason says so).
 * @returns {{ item: object, reason: string } | null}
 */
export function pickTopic(backlog, { existingSlugs = new Set(), lastCategory = null, slugOverride = null } = {}) {
  const items = backlog.items ?? [];
  if (slugOverride) {
    const item = items.find((i) => i.slug === slugOverride);
    if (!item) throw new Error(`Slug override "${slugOverride}" is not in content/backlog.json`);
    if (existingSlugs.has(item.slug)) throw new Error(`Slug override "${slugOverride}" already exists in content/${SOURCE_LOCALE}/${COLLECTION}`);
    return { item, reason: "slug override" };
  }
  const candidates = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.status === "todo" && !existingSlugs.has(item.slug))
    .sort(
      (a, b) =>
        (Number(a.item.priority) || PRIORITY_DEFAULT) - (Number(b.item.priority) || PRIORITY_DEFAULT) || a.index - b.index,
    );
  if (!candidates.length) return null;
  const diverse = candidates.find(({ item }) => !lastCategory || item.category !== lastCategory);
  if (diverse) {
    const top = candidates[0];
    const reason =
      diverse === top
        ? `highest priority todo (P${diverse.item.priority})`
        : `highest priority todo outside last category "${lastCategory}" (P${diverse.item.priority}; skipped "${top.item.slug}")`;
    return { item: diverse.item, reason };
  }
  return { item: candidates[0].item, reason: `only "${lastCategory}" topics left; diversity rule relaxed` };
}

export function markDone(backlog, slug, { date, title } = {}) {
  const item = (backlog.items ?? []).find((i) => i.slug === slug);
  if (!item) throw new Error(`markDone: ${slug} not in backlog`);
  item.status = "done";
  item.doneAt = date;
  if (!Array.isArray(backlog.history)) backlog.history = [];
  backlog.history.push({ slug, category: item.category, date, title: title ?? item.title });
  return backlog;
}

export function validateBacklog(backlog, categories) {
  const errors = [];
  const seen = new Set();
  for (const [i, it] of (backlog.items ?? []).entries()) {
    const where = `items[${i}] (${it.slug ?? "?"})`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(it.slug ?? "")) errors.push(`${where}: slug must be lower-case-kebab`);
    if (seen.has(it.slug)) errors.push(`${where}: duplicate slug`);
    seen.add(it.slug);
    if (!it.title) errors.push(`${where}: missing title`);
    if (categories.length && !categories.includes(it.category)) errors.push(`${where}: unknown category "${it.category}"`);
    if (!["todo", "done", "skipped"].includes(it.status)) errors.push(`${where}: status must be todo|done|skipped`);
    if (![1, 2, 3].includes(it.priority)) errors.push(`${where}: priority must be 1, 2 or 3`);
    for (const l of LOCALES) if (!Array.isArray(it.keywords?.[l])) errors.push(`${where}: keywords.${l} must be an array`);
    if (it.status === "todo" && !(it.keywords?.[SOURCE_LOCALE]?.length > 0))
      errors.push(`${where}: todo item needs at least one ${SOURCE_LOCALE.toUpperCase()} keyword`);
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Categories and internal links
// ---------------------------------------------------------------------------

/**
 * STUB (The Valet): journal categories are not defined yet (the site does not require a
 * category). The backlog keeps an optional `category` for topic diversity; while this list is
 * empty, any category (or none) is accepted.
 */
export const CATEGORIES = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature kept for the pipeline
export function loadCategories(root) {
  return [...CATEGORIES];
}

/**
 * Collections whose content files become internal link targets: /<locale>/<route>/<slug>/.
 * Service pages have locale-specific slugs read from content/<locale>/services/*.md.
 */
const COLLECTION_ROUTE = { journal: "journal", services: "services" };

/**
 * STUB (The Valet): internal paths that count as a call-to-action link (e.g. the contact page).
 * Not confirmed yet, so the CTA check is skipped while this is null.
 */
export const CTA_PATH_RE = null;
const EXCLUDED_STATIC = new Set(["legal-notice", "privacy"]);

/** Static pages under app/[locale] (no dynamic segments), e.g. ["", "about", "journal", ...]. */
export function staticPagePaths(root) {
  const base = path.join(root, "app", "[locale]");
  const out = [];
  const walk = (dir, segs) => {
    if (fs.existsSync(path.join(dir, "page.tsx")) && !segs.some((s) => s.startsWith("["))) out.push(segs.join("/"));
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name.startsWith("[") || e.name.startsWith("(")) continue;
      if (segs.length === 0 && EXCLUDED_STATIC.has(e.name)) continue;
      walk(path.join(dir, e.name), [...segs, e.name]);
    }
  };
  if (fs.existsSync(base)) walk(base, []);
  return out.sort();
}

/**
 * Allowed internal URLs for one locale, generated from the content files (never a static list).
 * Drafts and scheduled pages (publishAt after `today`) are not routes yet and are left out.
 * @returns {{ url: string, title: string, kind: string }[]}
 */
export function buildAllowedLinks(root, locale, { excludeSlug = null, today = new Date().toISOString().slice(0, 10) } = {}) {
  const links = staticPagePaths(root).map((p) => ({
    url: p ? `/${locale}/${p}/` : `/${locale}/`,
    title: p || "home",
    kind: "page",
  }));
  for (const [collection, route] of Object.entries(COLLECTION_ROUTE)) {
    const dir = path.join(root, "content", locale, collection);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md")).sort()) {
      const { data } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
      if (data.draft === true) continue;
      // Scheduled pages (publishAt in the future) are not built yet (src/lib/content.ts, validate-content.mjs).
      const publishAt = data.publishAt instanceof Date ? data.publishAt.toISOString().slice(0, 10) : data.publishAt;
      if (publishAt && String(publishAt) > today) continue;
      const slug = data.slug || f.replace(/\.md$/, "");
      if (collection === COLLECTION && slug === excludeSlug) continue;
      links.push({ url: `/${locale}/${route}/${slug}/`, title: String(data.title ?? slug), kind: collection });
    }
  }
  return links;
}

const markdownParser = unified().use(remarkParse).use(remarkGfm);

/** href values of <a>/<area> tags in a raw HTML fragment. */
export function htmlHrefs(html) {
  const out = [];
  for (const m of String(html).matchAll(/<(?:a|area)\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi)) {
    out.push((m[1] ?? m[2] ?? m[3] ?? "").trim());
  }
  return out;
}

/**
 * Every link target in a Markdown body, parsed from the Markdown AST (remark + GFM): inline
 * links, reference-style links (resolved through their definitions, plus every definition),
 * autolinks (<https://…> and bare GFM URLs/www.), images and raw HTML anchors.
 * Split into internal ("/…"), external (http(s) or protocol-relative) and other (relative,
 * mailto:, javascript:, … — never allowed in an article). In-page anchors ("#…") are ignored.
 * @returns {{ internal: string[], external: string[], other: string[] }}
 */
export function extractLinks(body) {
  const internal = [];
  const external = [];
  const other = [];
  const add = (raw) => {
    const href = String(raw ?? "").trim();
    if (!href || href.startsWith("#")) return;
    if (/^https?:\/\//i.test(href)) external.push(href);
    else if (href.startsWith("//")) external.push(`https:${href}`);
    else if (href.startsWith("/")) internal.push(href);
    else other.push(href);
  };
  const visit = (node) => {
    // linkReference/imageReference resolve to a definition node, which is collected here.
    if (node.type === "link" || node.type === "image" || node.type === "definition") add(node.url);
    // raw HTML anchors; also text nodes, in case a malformed tag was not recognised as HTML
    else if (node.type === "html" || node.type === "text") htmlHrefs(node.value).forEach(add);
    for (const c of node.children ?? []) visit(c);
  };
  visit(markdownParser.parse(String(body)));
  return { internal, external, other };
}

// ---------------------------------------------------------------------------
// Fact base (read at run time; UNVERIFIED sentences never reach the model)
// ---------------------------------------------------------------------------

export function splitSentences(text) {
  return String(text)
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?;])\s+(?=[A-Z("*\[])/))
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Remove every sentence that carries an UNVERIFIED marker. */
export function stripUnverified(text) {
  return String(text)
    .split("\n")
    .map((line) => {
      if (!/UNVERIFIED/i.test(line)) return line;
      const kept = line.split(/(?<=[.!?;])\s+(?=[A-Z("*\[])/).filter((s) => !/UNVERIFIED/i.test(s));
      const joined = kept.join(" ").trim();
      return /^[-*]?\s*$/.test(joined) ? null : joined;
    })
    .filter((l) => l !== null)
    .join("\n");
}

/** Keep only the `## …` sections of a markdown file whose heading matches `re`. */
export function extractH2Sections(md, re) {
  const out = [];
  let keep = false;
  for (const line of String(md).split("\n")) {
    if (/^##\s/.test(line)) keep = re.test(line);
    if (keep) out.push(line);
  }
  return out.join("\n").trim();
}

/**
 * STUB (The Valet): editorial brief and fact base to be written before re-enabling — see
 * workflow header note. When it exists, point FACT_BASE_FILE at it (path relative to the repo
 * root, markdown with `##`/`###` sections, UNVERIFIED markers allowed). While it is null the fact
 * base is empty, so every number in a generated article fails grounding (by design).
 */
export const FACT_BASE_FILE = null;

/** The fact base as one markdown document ("" while FACT_BASE_FILE is a stub). */
export function loadFactSources(root) {
  if (!FACT_BASE_FILE) return "";
  const file = path.join(root, FACT_BASE_FILE);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

/** Split the fact base into `###`/`##` sections. */
export function parseFactSections(md) {
  const sections = [];
  let parent = "";
  let current = null;
  for (const line of String(md).split("\n")) {
    const h2 = /^##\s+(.*)/.exec(line);
    const h3 = /^###\s+(.*)/.exec(line);
    if (h3 || h2) {
      if (current) sections.push(current);
      if (h2 && !h3) parent = h2[1].trim();
      current = { heading: (h3 ?? h2)[1].trim(), parent: h3 ? parent : "", lines: [line] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);
  return sections.map((s) => ({ heading: s.heading, parent: s.parent, text: s.lines.join("\n").trim() }));
}

/** STUB (The Valet): category → fact-base section heading hints (empty until categories exist). */
const CATEGORY_SECTION_HINTS = {};

const STOP = new Set(
  "the a an and or of to in on for with from your you is are how what when which who can do does be at by as it its into after before en de la le les des du et pour un une dans die der das und für mit von nach"
    .split(" "),
);
export const tokens = (s) =>
  String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t));

/**
 * Fact-base context for a topic: relevant sections first (category hints + keyword overlap),
 * then every other section, until maxChars. Always strips UNVERIFIED sentences.
 */
export function selectFacts(md, topic, { maxChars = 100000 } = {}) {
  const intro = String(md).split(/\n##\s/)[0];
  const sections = parseFactSections(md).filter((s) => !/source documents/i.test(s.heading));
  const topicTokens = new Set(tokens([topic.title, ...(topic.keywords?.[SOURCE_LOCALE] ?? []), topic.slug.replace(/-/g, " ")].join(" ")));
  const hints = CATEGORY_SECTION_HINTS[topic.category] ?? [];
  const scored = sections.map((s, index) => {
    const head = `${s.parent} ${s.heading}`;
    let score = hints.some((h) => h.test(head)) ? 10 : 0;
    // New or benchmark sections (e.g. a verification pass) are always worth reading.
    if (/benchmark|verification|verified|correction/i.test(head)) score += 8;
    const sTokens = tokens(s.text);
    for (const t of sTokens) if (topicTokens.has(t)) score += 0.2;
    return { ...s, index, score };
  });
  const ordered = [...scored].sort((a, b) => b.score - a.score || a.index - b.index);
  const out = [stripUnverified(intro).trim()];
  const relevant = [];
  let size = out[0].length;
  for (const s of ordered) {
    const text = stripUnverified(s.text);
    if (size + text.length > maxChars) continue;
    out.push(s.parent ? `<!-- ${s.parent} -->\n${text}` : text);
    size += text.length;
    if (s.score >= 2) relevant.push(s.heading);
  }
  return { text: out.join("\n\n"), relevantSections: relevant };
}

// ---------------------------------------------------------------------------
// Numbers: extraction, normalisation, parity
// ---------------------------------------------------------------------------

const NUM_TOKEN = /\d+(?:(?:[.,'’]|[    ](?=\d{3}(?!\d)))\d+)*/g;

/**
 * Normalise one numeric token to a canonical string.
 * Thousands separators: ' ’ space nbsp narrow-nbsp thin-space (any locale), comma (en only).
 * Decimal separator: dot (en) or comma (fr). Multi-dot references like "211.412.41" stay as-is.
 */
export function normalizeNumber(token, locale) {
  let t = String(token).replace(/['’    ]/g, "");
  if (locale === "en") {
    if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) t = t.replace(/,/g, "");
  } else if (/^\d+,\d+$/.test(t)) {
    t = t.replace(",", ".");
  } else if (/^\d{1,3}(,\d{3})+$/.test(t)) {
    // en-style thousands in a fr text: keep distinguishable so parity flags it
    return `?${t}`;
  }
  if (/^\d+(\.\d+)?$/.test(t)) return String(Number(t));
  return t;
}

/**
 * Strip link targets, reference definitions, URLs, HTML comments/tags, code and ordered-list
 * markers so only prose numbers remain.
 */
export function proseOnly(text) {
  return String(text)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]*`/g, " ")
    .replace(/^\s{0,3}\[[^\]\n]+\]:\s*\S+.*$/gm, " ")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/<\/?[a-z][^>\n]*>/gi, " ")
    .replace(/(?:https?:\/\/|www\.)\S+/g, " ")
    .replace(/^(\s*)\d{1,2}[.)](?=\s)/gm, "$1");
}

/**
 * Set of normalised numbers in a text. Every digit sequence counts, including small integers
 * ("3 hours", "2 days") — they are factual claims as often as anything else, so the
 * guardrails (parity, UNVERIFIED, grounding) never skip them. Numbers must therefore be written
 * as digits in every locale (the prompts require it and SPELLED_THRESHOLD flags the rest).
 * (A third options argument, formerly `{ keepSmall }`, is ignored.)
 */
export function extractNumbers(text, locale) {
  const out = new Set();
  for (const m of proseOnly(text).matchAll(NUM_TOKEN)) out.add(normalizeNumber(m[0], locale));
  return out;
}

// ---------------------------------------------------------------------------
// Fact grounding: every number in an article must come from the fact base
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  ["january", "jan", "janvier", "janv", "januar", "jänner"],
  ["february", "feb", "février", "fév", "févr", "februar"],
  ["march", "mar", "mars", "märz", "maerz"],
  ["april", "apr", "avril", "avr"],
  ["may", "mai"],
  ["june", "jun", "juin", "juni"],
  ["july", "jul", "juillet", "juil", "juli"],
  ["august", "aug", "août", "aout"],
  ["september", "sep", "sept", "septembre"],
  ["october", "oct", "octobre", "oktober", "okt"],
  ["november", "nov", "novembre"],
  ["december", "dec", "décembre", "déc", "dezember", "dez"],
];
const MONTH_OF = new Map(MONTH_NAMES.flatMap((names, i) => names.map((n) => [n, i + 1])));
const MONTH_ALT = [...MONTH_OF.keys()].sort((a, b) => b.length - a.length).join("|");
const pad2 = (n) => String(n).padStart(2, "0");

/** Dates, most specific first. Each yields {y?, m, d?}. */
const DATE_PATTERNS = [
  { re: /\b((?:19|20)\d\d)-(\d\d)-(\d\d)\b/g, get: (m) => ({ y: m[1], m: +m[2], d: +m[3] }) },
  {
    re: new RegExp(String.raw`(?<![\p{L}\d])(\d{1,2})(?:er|st|nd|rd|th|\.)?\s+(${MONTH_ALT})\.?\s+((?:18|19|20)\d\d)(?!\d)`, "giu"),
    get: (m) => ({ y: m[3], m: MONTH_OF.get(m[2].toLowerCase()), d: +m[1] }),
  },
  {
    re: new RegExp(String.raw`(?<![\p{L}])(${MONTH_ALT})\.?\s+(\d{1,2}),?\s+((?:18|19|20)\d\d)(?!\d)`, "giu"),
    get: (m) => ({ y: m[3], m: MONTH_OF.get(m[1].toLowerCase()), d: +m[2] }),
  },
  {
    re: new RegExp(String.raw`(?<![\p{L}\d])(\d{1,2})(?:er|st|nd|rd|th|\.)?\s+(${MONTH_ALT})(?![\p{L}])`, "giu"),
    // "under 18 may join": the English modal is not a month without a year
    get: (m) => (/^may$/i.test(m[2]) ? {} : { m: MONTH_OF.get(m[2].toLowerCase()), d: +m[1] }),
  },
  {
    re: new RegExp(String.raw`(?<![\p{L}])(${MONTH_ALT})\.?\s+((?:18|19|20)\d\d)(?!\d)`, "giu"),
    get: (m) => ({ y: m[2], m: MONTH_OF.get(m[1].toLowerCase()) }),
  },
];
const dateKey = ({ y, m, d }) => `${y ?? "----"}-${pad2(m)}${d ? `-${pad2(d)}` : ""}`;

/**
 * Citation numbers: article/paragraph/letter numbers, SR/RS/AS classification numbers, circular
 * and decision numbers — optionally chained ("art. 14 para. 3", "AS 2025 579", "art. 14–16").
 * Words that are also ordinary words ("as", "no") only count in their citation spelling.
 */
const CITATION_CASE_SENSITIVE = /(?<![\p{L}])(?:SR|RS|AS|RO|FF|BBl|KS|BGE|ATF|DTF|No\.|Nos\.|no\.|Nr\.|n°|N°)\s*(?:\d[\w.]*\s*(?:(?:,|\/|–|-|and|et|und|or|ou|oder|to|bis|à)\s*)?)*$/u;
const CITATION_WORDS_CI = /(?:(?<![\p{L}])(?:art|arts|article|articles|artikel|para|paras|paragraph|paragraphs|paragraphe|al|alinéa|alinéas|abs|absatz|lit|let|bst|ziff|ch|chiffre|section|sections|chapter|chapitre|kapitel|annex|annexe|anhang|appendix|circular|circulaire|kreisschreiben|rundschreiben)\.?|§§?)\s*(?:\d[\w.]*\s*(?:(?:,|\/|–|-|and|et|und|or|ou|oder|to|bis|à)\s*)?)*$/iu;
const isCitationContext = (before) => CITATION_WORDS_CI.test(before) || CITATION_CASE_SENSITIVE.test(before);

/** A statute/source document named right before "of/du/vom <date or year>" or right after a year. */
const DOC_NOUN =
  String.raw`act|law|ordinance|circular|treaty|convention|agreement|dta|decision|ruling|judgment|press release|communiqué|fact sheet|notice|guidance|directive|report|message|vote|loi|ordonnance|circulaire|accord|décision|arrêt|rapport|votation|gesetz|bundesgesetz|verordnung|kreisschreiben|rundschreiben|abkommen|entscheid|urteil|medienmitteilung|merkblatt|weisung|bericht|botschaft|abstimmung|KS|No\.|Nr\.|n°`;
const SOURCE_DATE_BEFORE = new RegExp(String.raw`(?:${DOC_NOUN})\b[^.;:!?]{0,50}?(?<![\p{L}])(?:of|dated|du|vom|en date du)\s*$`, "iu");
const STATUTE_YEAR_AFTER = new RegExp(String.raw`^\s*(?:${DOC_NOUN})(?![\p{L}])`, "iu");
const AS_OF_BEFORE = /(?:as (?:of|at)|stand|au|état au|updated|mis à jour|aktualisiert|reviewed|v\.)\s*\(?\s*$/iu;

const MULTIPLIER = String.raw`(?:\s*(?:m|mn|million|millions|bn|billion|billions|mio\.?|mrd\.?|milliards?|milliarden?)(?![\p{L}]))?`;
const UNIT_AFTER = [
  ["percent", /^(?:%|percent\b|per cent\b|pour cent\b|prozent\b|pct\b)/iu],
  // "…beträgt 2026 CHF 435'000": a currency followed by a number belongs to that number
  ["money", /^(?:CHF\b|francs?\b|franken\b|EUR\b|euros?\b|€|USD\b|dollars?\b|GBP\b|pounds?\b|£|AED\b)(?!\s?\d)/iu],
  ["times", /^(?:×|x(?![\p{L}])|times\b|fois\b|mal\b|fache\p{L}*|-?fach\p{L}*)/iu],
  ["day", /^(?:days?\b|calendar days?\b|jours?\b|tage?n?\b|tages\b|kalendertage?n?\b)/iu],
  ["week", /^(?:weeks?\b|semaines?\b|wochen?\b)/iu],
  ["month", /^(?:months?\b|mois\b|monate?n?\b|monats\b)/iu],
  ["year", /^(?:years?\b|yrs?\b|ans?\b|années?\b|jahre?n?\b|jahres\b)/iu],
  ["hour", /^(?:hours?\b|heures?\b|stunden?\b)/iu],
];
const CURRENCY_BEFORE = /(?:CHF|SFr\.?|Fr\.|EUR|€|USD|US\$|\$|£|GBP|AED)\s?$/u;
const RANGE_TAIL = new RegExp(String.raw`^(?:\s*(?:\/|–|-|to|or|and|,|bis|à|ou|oder|und|et)\s*\d[\d.,'’   ]*)*`, "iu");

/**
 * Ages ("enfants de moins de 18 ans", "retraités âgés de 55 ans", "Kinder unter 18 Jahren", "55 Jahre
 * alt") are not durations: EN writes "children under 18" / "aged 55" without a unit, so FR/DE
 * "ans"/"Jahre" must not turn them into a strict year value that the fact base lacks.
 */
const AGE_BEFORE =
  /(?:(?<![\p{L}])(?:âg[ée]e?s?|âge|aged?|enfants?|mineurs?|retraité\p{L}*|pensionné\p{L}*|alter|kinder\p{L}*|jugendlich\p{L}*|minderjährig\p{L}*|rentner\p{L}*|pensionier\p{L}*|ruhestand|ruheständ\p{L}*|personen|personnes?|seniors?|senior\p{L}*))(?![\p{L}])[^.;:!?\d]{0,30}$/iu;
const AGE_AFTER = /^\s*(?:ans?|jahre?n?)\s+(?:et plus|ou plus|révolus|alt|oder älter|und älter)(?![\p{L}])/iu;

function unitAfter(after) {
  let rest = after.replace(RANGE_TAIL, "");
  rest = rest.replace(new RegExp(`^${MULTIPLIER}`, "iu"), "").replace(/^\s*-?\s*/, "");
  for (const [unit, re] of UNIT_AFTER) if (re.test(rest)) return unit;
  // one adjective in between: "30 calendar days", "10 full years", "7 fois le loyer" is handled above
  const skipOne = /^[\p{L}'’-]+\s+/u.exec(rest);
  if (skipOne) {
    const r2 = rest.slice(skipOne[0].length);
    for (const [unit, re] of UNIT_AFTER) if (unit !== "money" && unit !== "times" && re.test(r2)) return unit;
  }
  return "num";
}

/**
 * Every number in a text, classified: dates ("24 July 2018", "1er janvier", "September 2026"),
 * citation numbers ("art. 14", "para. 3", "SR 642.11") and plain numbers with their unit
 * (money, percent, times, day, week, month, year, hour, age, or num).
 * @returns {{ kind: "date"|"citation"|"number", value: string, unit?: string, raw: string, index: number, before: string, after: string }[]}
 */
export function numberMentions(text, locale) {
  const prose = proseOnly(text);
  const out = [];
  const taken = [];
  const free = (a, b) => !taken.some(([x, y]) => a < y && b > x);
  for (const { re, get } of DATE_PATTERNS) {
    for (const m of prose.matchAll(re)) {
      const a = m.index;
      const b = a + m[0].length;
      if (!free(a, b)) continue;
      const parts = get(m);
      if (!parts.m || (parts.d && (parts.d < 1 || parts.d > 31))) continue;
      taken.push([a, b]);
      out.push({ kind: "date", value: dateKey(parts), raw: m[0], index: a, before: prose.slice(Math.max(0, a - 80), a), after: prose.slice(b, b + 40) });
    }
  }
  for (const m of prose.matchAll(NUM_TOKEN)) {
    const a = m.index;
    const b = a + m[0].length;
    if (!free(a, b)) continue;
    const before = prose.slice(Math.max(0, a - 80), a);
    const after = prose.slice(b, b + 60);
    const value = normalizeNumber(m[0], locale);
    if (isCitationContext(before) || /^\s*(?:bis|ter|quater)\b/i.test(after)) {
      out.push({ kind: "citation", value, raw: m[0], index: a, before, after });
      continue;
    }
    let unit = CURRENCY_BEFORE.test(before) ? "money" : unitAfter(after);
    if (unit === "year" && (AGE_BEFORE.test(before) || AGE_AFTER.test(after))) unit = "age";
    out.push({ kind: "number", value, unit, raw: m[0], index: a, before, after });
  }
  return out.sort((x, y) => x.index - y.index);
}

/** Index of the fact base: values, value+unit pairs and dates (all locales' spellings). */
export function buildFactIndex(corpusText) {
  const values = new Set();
  const pairs = new Set();
  const dates = new Set();
  for (const locale of ["en", "fr"]) {
    for (const m of numberMentions(corpusText, locale)) {
      if (m.kind === "date") {
        dates.add(m.value);
        const [y, mo, d] = m.value.split("-");
        if (d) dates.add(`----${mo}-${d}`);
        if (y !== "----") {
          dates.add(`${y}-${mo}`);
          values.add(y);
        }
        if (d) values.add(String(Number(d)));
        continue;
      }
      values.add(m.value);
      if (m.kind === "number") pairs.add(`${m.unit}:${m.value}`);
    }
  }
  return { values, pairs, dates };
}

// "age" is deliberately not strict: an age only has to appear as a value in the fact base.
const STRICT_UNITS = new Set(["money", "percent", "times", "day", "week", "month", "year", "hour"]);

/**
 * Numbers in `text` that the fact base does not support.
 * - Citation numbers (art./para./lit./SR/AS/§/No. …) are allowed: they identify the source.
 * - Dates: grounded if the fact base has them; allowed as a source date ("Circular No. 44 of
 *   24 July 2018", "Act of 1990") or as the article's own "as of" date; otherwise (deadlines,
 *   effective dates) they must be in the fact base.
 * - Amounts, percentages, multipliers and durations must match value AND unit in the fact base
 *   ("30 days" is not grounded by "30 years").
 * - Anything else must at least appear as a value in the fact base.
 * @param {{ values: Set<string>, pairs: Set<string>, dates: Set<string> }} index from buildFactIndex
 * @returns {{ raw: string, value: string, unit: string }[]}
 */
export function ungroundedNumbers(text, locale, index, { asOf = null } = {}) {
  const asOfDate = asOf ? String(asOf).slice(0, 10) : null;
  const out = [];
  for (const m of numberMentions(text, locale)) {
    if (m.kind === "citation") continue;
    if (m.kind === "date") {
      if (index.dates.has(m.value)) continue;
      if (SOURCE_DATE_BEFORE.test(m.before)) continue;
      if (asOfDate && (asOfDate === m.value || asOfDate.slice(0, 7) === m.value)) continue;
      const [, mo, d] = m.value.split("-");
      if (asOfDate && AS_OF_BEFORE.test(m.before) && asOfDate.slice(5) === `${mo}-${d ?? ""}`.replace(/-$/, "")) continue;
      out.push({ raw: m.raw, value: m.value, unit: "date" });
      continue;
    }
    if (/^(?:18|19|20)\d\d$/.test(m.value) && m.unit === "num") {
      if (index.values.has(m.value) || STATUTE_YEAR_AFTER.test(m.after) || SOURCE_DATE_BEFORE.test(m.before)) continue;
      if (asOfDate && asOfDate.startsWith(m.value) && AS_OF_BEFORE.test(m.before)) continue;
      out.push({ raw: m.raw, value: m.value, unit: "year-date" });
      continue;
    }
    if (STRICT_UNITS.has(m.unit) ? index.pairs.has(`${m.unit}:${m.value}`) : index.values.has(m.value)) continue;
    out.push({ raw: m.raw, value: m.value, unit: m.unit });
  }
  return out;
}

/**
 * Spelled-out numbers next to a unit ("seven days", "trois mois"):
 * they would bypass parity and grounding, so thresholds must be written as digits.
 */
export const SPELLED_THRESHOLD = new RegExp(
  [
    String.raw`(?<![\p{L}])(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty|ninety|hundred)[\s-]+(calendar\s+|full\s+)?(days?|weeks?|months?|years?|times|per\s?cent|percent)(?![\p{L}])`,
    String.raw`(?<![\p{L}])(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|quinze|vingt|trente|quarante|cinquante|soixante|quatre-vingt-dix|cent)\s+(jours|semaines|mois|ans|années|fois|pour\s+cent)(?![\p{L}])`,
    String.raw`(?<![\p{L}])(zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|fünfzehn|zwanzig|dreissig|dreißig|vierzig|fünfzig|sechzig|neunzig|hundert)(?:\s*-?fach\p{L}*|\s+(?:tage?n?|wochen|monate?n?|jahre?n?|prozent))(?![\p{L}])`,
  ].join("|"),
  "iu",
);

export function articleNumberText(article) {
  const faq = (article.data.faq ?? []).map((f) => `${f.q}\n${f.a}`).join("\n");
  return `${article.body}\n${faq}`;
}

const metaText = (article) => `${article.data.title ?? ""}\n${article.data.description ?? ""}`;

/** Compare the numeric facts of the source locale against each translation. Returns error strings. */
export function checkNumberParity(articles) {
  const errors = [];
  const src = SOURCE_LOCALE;
  if (!articles[src]) return [`parity: ${src} (source) missing`];
  const base = extractNumbers(articleNumberText(articles[src]), src);
  for (const l of TARGET_LOCALES) {
    if (!articles[l]) continue;
    const other = extractNumbers(articleNumberText(articles[l]), l);
    const missing = [...base].filter((n) => !other.has(n));
    const extra = [...other].filter((n) => !base.has(n));
    if (missing.length) errors.push(`parity: ${l} is missing numbers present in ${src}: ${missing.join(", ")}`);
    if (extra.length) errors.push(`parity: ${l} has numbers not in ${src}: ${extra.join(", ")}`);
  }
  return errors;
}

const MONEY_OR_PERCENT = new RegExp(
  String.raw`(?:CHF|Fr\.|EUR|€|USD|US\$|\$|£|GBP|AED)\s?(${NUM_TOKEN.source})|(${NUM_TOKEN.source})\s?(?:%|percent\b|per cent\b|pour cent\b|Prozent\b|€|CHF\b|EUR\b|USD\b|GBP\b|AED\b|francs?\b|Franken\b|euros?\b|pounds?\b|dollars?\b)`,
  "gi",
);

/** Money amounts and percentages in a text (normalised). */
export function extractFigures(text, locale) {
  const out = new Set();
  for (const m of proseOnly(text).matchAll(MONEY_OR_PERCENT)) out.add(normalizeNumber(m[1] ?? m[2], locale));
  return out;
}

/** Currency amounts in either order ("CHF 5,000", "5 000 CHF", "CHF 1.2 m"); group 1 or 2 is the number. */
const CURRENCY_AMOUNT_G = new RegExp(
  String.raw`(?:CHF|SFr\.?|Fr\.|EUR|€|USD|US\$|\$|£|GBP|AED)\s?(${NUM_TOKEN.source})${MULTIPLIER}|(${NUM_TOKEN.source})${MULTIPLIER}\s?(?:CHF|EUR|€|USD|GBP|AED|francs?|Franken|euros?|pounds?|dollars?)(?![\p{L}])`,
  "giu",
);
const currencyAmounts = (s) => [...String(s).matchAll(CURRENCY_AMOUNT_G)].map((m) => ({ index: m.index, token: m[1] ?? m[2] }));

/**
 * Pricing lexicon (EN/FR, plus a few legacy DE stems). Word-start anchored.
 * "forfait" alone is deliberately absent: it is ambiguous in FR ("forfait de ski" = ski pass);
 * the commercial "forfait tout compris" is caught by COMMERCIAL_ASSERTION.
 */
const PRICE_WORD_G = new RegExp(
  String.raw`(?<![\p{L}])(?:costs?|costing|costed|fees?|prices?|priced|pricing|rates?|charges?|charged|charging|tariffs?|quotes?|quoted|invoiced?|billed|billing|retainer|packages?|coûts?|coûte|coûtent|coûter|tarifs?|tarifé\p{L}*|tarification|honoraires?|prix|frais|émoluments?|factur\p{L}+|devis|kosten|kostet|gebühr\p{L}*|honorar\p{L}*|preis\p{L}*|tarif\p{L}*|stundensatz\p{L}*|pauschalpreis\p{L}*|offerte\p{L}*|verrechne\p{L}*|in rechnung)(?![\p{L}])`,
  "giu",
);
/** Terms that contain a price word but do not describe what anyone charges. */
const LEGAL_COST_TERMS =
  /(?:living|maintenance|management|acquisition|asset-management)\s+costs?|costs? of living|(?:tax|interest|exchange|conversion|withholding)\s+rates?|rate for (?:total|the whole) income|frais (?:d['’]entretien|de gestion|de subsistance)|coût de la vie|steuersatz\p{L}*|zinssatz\p{L}*|lebenshaltungskosten|unterhaltskosten|verwaltungskosten/giu;
/** Price assertions that need no fee word: "starting at CHF 900", "CHF 400 per hour", "flat fee". */
const COMMERCIAL_ASSERTION = new RegExp(
  [
    String.raw`(?<![\p{L}])(?:starting (?:at|from)|as little as|prices? from|fees? from|à partir de seulement|dès seulement|seulement|nur|bereits ab|schon ab)\s+(?:CHF|SFr\.?|Fr\.|EUR|€|USD|US\$|\$|£|GBP|AED)\s?\d`,
    String.raw`(?:CHF|SFr\.?|Fr\.|EUR|€|USD|\$|£|GBP|AED)\s?\d[\d'’.,   ]*(?:\s?(?:CHF|francs?|Franken))?\s*(?:per|\/|par|pro|de l['’]|la|le)\s*(?:hours?|h|hr|session|consultation|meeting|mandate|heure|séance|mandat|stunde|std\.?|sitzung|beratung)(?![\p{L}])`,
    String.raw`(?<![\p{L}])(?:flat|fixed|all-inclusive|package)[\s-]+(?:fees?|prices?|rates?)|prix (?:fixe|forfaitaire|tout compris)|forfait tout compris|festpreis\p{L}*|pauschalhonorar\p{L}*|pauschalangebot\p{L}*`,
  ].join("|"),
  "iu",
);
const FIRST_PERSON = /(?<![\p{L}])(?:we|we['’]ve|our|ours|us|nous|notre|nos|wir|unser\p{L}*|uns)(?![\p{L}])/iu;

function amountGrounded(token, factIndex) {
  return ["en", "fr"].some((l) => factIndex.pairs.has(`money:${normalizeNumber(token, l)}`));
}

/**
 * A price assertion: a commercial price pattern, or a price/fee/cost word within ~80 characters
 * of a currency amount. Amounts that the fact base already holds (tax bases, statutory thresholds)
 * are allowed next to cost words unless the sentence speaks in the first person.
 * @param {string} s one sentence
 * @param {{ factIndex?: { pairs: Set<string> } }} [ctx]
 */
export function isPriceAssertion(s, ctx = {}) {
  const amounts = currencyAmounts(s);
  if (!amounts.length) return false;
  if (COMMERCIAL_ASSERTION.test(s)) return true;
  const cleaned = String(s).replace(LEGAL_COST_TERMS, (m) => " ".repeat(m.length));
  const words = [...cleaned.matchAll(PRICE_WORD_G)].map((m) => m.index);
  if (!words.length) return false;
  const near = amounts.filter((a) => words.some((w) => Math.abs(w - a.index) <= 80));
  if (!near.length) return false;
  if (FIRST_PERSON.test(s) || !ctx.factIndex) return true;
  return near.some((a) => !amountGrounded(a.token, ctx.factIndex));
}

/** Testimonials, client counts, star ratings (EN/FR, plus legacy DE patterns). */
const SOCIAL_PROOF_ANY = new RegExp(
  [
    // testimonials, reviews, ratings
    String.raw`(?<![\p{L}])(?:testimonials?|client reviews?|customer reviews?|reviews? from (?:our )?clients|(?:happy|satisfied) (?:clients|customers|families)|trusted by|rated\s+\d|five[- ]star|5[- ]star|\d(?:[.,]\d)?\s*(?:\/\s*5|out of (?:5|five)|stars?)(?![\p{L}])|★|⭐)`,
    String.raw`(?<![\p{L}])(?:témoignages?|avis (?:de |des )?clients?|clients? (?:satisfaits?|heureux|ravis)|familles (?:satisfaites|ravies)|note (?:moyenne )?de \d|\d\s+étoiles|cinq étoiles)`,
    String.raw`(?<![\p{L}])(?:erfahrungsberichte?|kundenstimmen?|kundenbewertung\p{L}*|bewertungen unserer|zufriedene[nr]? (?:kunden|familien|mandanten)|\d\s+sterne|fünf sterne|sterne-bewertung)`,
    // client counts: "helped 200 families", "over 150 clients have trusted us"
    String.raw`(?<![\p{L}])(?:helped|assisted|served|advised|relocated|supported|guided|accompanied|moved)\s+(?:over |more than |nearly |almost |some |hundreds of |thousands of |dozens of |\d[\d,.'’   ]*\+?\s*)+(?:clients|families|customers|people|individuals|households|entrepreneurs)`,
    String.raw`\d[\d,.'’   ]*\+?\s+(?:clients|families|customers|households)\s+(?:have\s+|already\s+)*(?:trusted|chosen|relocated|moved|rely|relied|used|worked)`,
    String.raw`(?:aidé|accompagné|conseillé|servi|installé|relocalisé)\s+(?:plus de |près de |des centaines de |des milliers de |\d[\d'’.   ]*\+?\s*)+(?:clients|familles|personnes|ménages)`,
    String.raw`(?:plus de |près de |\d[\d'’.   ]*\+?\s+)(?:clients|familles)\s+(?:nous\s+)?(?:ont|font)\s+(?:déjà\s+)?(?:fait confiance|confiance|choisi)`,
    String.raw`(?:über |mehr als |hunderte[n]? |tausende[n]? |\d[\d'’.   ]*\+?\s+)(?:kunden|familien|personen|haushalte|mandanten)\s+(?:erfolgreich\s+)?(?:begleitet|betreut|beraten|geholfen|unterstützt|vertrauen)`,
  ].join("|"),
  "iu",
);
const EXPERIENCE_CLAIM =
  /(?:\d+\+?|a decade|decades|two decades|many years|a combined|over \d+|more than \d+)\s+(?:years?\s+)?(?:of\s+)?(?:experience|expertise|track record|in business)|(?:\d+\+?|plus de \d+|des|de nombreuses|vingt|dix)\s+(?:ans|années)\s+d['’](?:expérience|expertise)|(?:\d+\+?|über \d+|mehr als \d+)\s+jahre\p{L}*\s+(?:erfahrung|expertise)|(?:jahrzehntelange|langjährige|jahrelange)\s+erfahrung/iu;

/** One sentence claims social proof. Years-of-experience claims only count in the first person. */
export function isSocialProof(s) {
  return SOCIAL_PROOF_ANY.test(s) || (EXPERIENCE_CLAIM.test(s) && FIRST_PERSON.test(s));
}

/** Numbers that the fact base only mentions inside UNVERIFIED sentences. */
export function unverifiedOnlyNumbers(factsMd) {
  const verified = extractNumbers(stripUnverified(factsMd), "en");
  const unverified = new Set();
  for (const s of splitSentences(factsMd).filter((x) => /UNVERIFIED/i.test(x))) {
    for (const n of extractNumbers(s, "en")) {
      if (verified.has(n)) continue;
      if (/^(19|20)\d\d$/.test(n)) continue;
      unverified.add(n);
    }
  }
  return unverified;
}

// ---------------------------------------------------------------------------
// Guardrails
// ---------------------------------------------------------------------------

export function countWords(markdown) {
  const text = String(markdown)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/[#>*_|`[\]-]+/g, " ");
  return (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.,]*/gu) ?? []).length;
}

/**
 * STUB (The Valet): required structure markers per locale. These are the generic markers of the
 * previous pipeline (key-facts box, "how we help" section, closing "general information" line);
 * confirm or replace them with the editorial brief.
 */
const PATTERNS = {
  keyFacts: { en: /key facts|at a glance/i, fr: /points clés|l['’]essentiel/i },
  howWeHelp: {
    en: /^##\s+how we help/im,
    fr: /^##\s+comment nous (vous )?(aidons|accompagnons)/im,
  },
  disclaimer: {
    en: /general\s+information/i,
    fr: /informations?\s+générales?/i,
  },
};

const GUARANTEE_WORD = /(?<![\p{L}])(?:guarantee(?:s|d)?|guaranteeing|garanti\p{L}*|garantier\p{L}*)(?![\p{L}])/giu;
/** Affirmative promises that stay forbidden even in a question ("we guarantee", "guaranteed approval"). */
const GUARANTEE_PROMISE =
  /(?<![\p{L}])(?:we (?:can |will )?guarantee|guaranteed (?:approval|availability|booking|reservation|access|success|result|outcome|acceptance)|100\s?% guaranteed|nous (?:vous )?garantissons|(?:approbation|disponibilité|réservation|accès|succès|résultat|obtention) garanti\p{L}*|wir garantieren|garantierte[nrs]? (?:bewilligung|erfolg|ergebnis|zusage))(?![\p{L}])/iu;
/** A negation right before the guarantee word: "does not guarantee", "no guarantee", "ne garantit", "n'est pas garanti", "keine Garantie", "ist nicht garantiert". */
const GUARANTEE_NEG_BEFORE =
  /(?<![\p{L}])(?:not|no|never|cannot|can['’]t|doesn['’]t|don['’]t|isn['’]t|aren['’]t|won['’]t|without|nor|neither|ne|n['’]|pas|jamais|aucun\p{L}*|sans|ni|nicht|nie|niemals|kein\p{L}*|ohne|weder)(?![\p{L}])[^.:;!?|]{0,24}$/iu;
const GUARANTEE_NOT_ONLY = /(?<![\p{L}])(?:not only|non seulement|nicht nur)(?![\p{L}])[^.:;!?|]{0,24}$/iu;
/** A negation right after it: "ne garantit pas", "garantiert nicht", "guarantees nothing". */
const GUARANTEE_NEG_AFTER = /^[\s,-]*(?:-(?:il|elle|t-il|t-elle)\s+)?(?:pas|aucun\p{L}*|rien|nicht|kein\p{L}*|nichts|nothing|no(?![\p{L}]))/iu;
/** FR places the negation after the object: "ne garantit à personne aucune réservation". */
const GUARANTEE_NEG_LATER = /(?<![\p{L}])(?:pas|aucun\p{L}*|nullement|nicht|kein\p{L}*|keineswegs)(?![\p{L}])/iu;
/** The clause right after the verb: stops at punctuation and at words that start another clause or invert a negation. */
const clauseAfter = (after) => after.split(/[.,:;!?|]|(?<![\p{L}])(?:et|und|oder|ou|sans|ohne|dass|que|qui|mais|aber|sondern)(?![\p{L}])/iu)[0].slice(0, 50);

/**
 * True when a sentence promises a guarantee. Legitimate uses pass: questions ("Does booking
 * early guarantee a table?"), negations next to the word ("does not guarantee", "no
 * guarantee", "ne garantit pas"). Affirmative promises ("we guarantee", "guaranteed
 * availability", "la réservation est garantie") are rejected.
 */
export function isGuaranteePromise(sentence) {
  const s = String(sentence);
  const matches = [...s.matchAll(GUARANTEE_WORD)];
  if (!matches.length) return false;
  const promise = GUARANTEE_PROMISE.exec(s);
  if (promise && !GUARANTEE_NEG_AFTER.test(s.slice(promise.index + promise[0].length, promise.index + promise[0].length + 20))) return true;
  const isQuestion = /\?[\s*_|)»"”]*$/u.test(s.trim());
  if (isQuestion) return false;
  return matches.some((m) => {
    const before = s.slice(Math.max(0, m.index - 40), m.index);
    const after = s.slice(m.index + m[0].length, m.index + m[0].length + 60);
    const negBefore = GUARANTEE_NEG_BEFORE.test(before) && !GUARANTEE_NOT_ONLY.test(before);
    const verb = /^garanti(?:t|ssent|ert|eren)$/iu.test(m[0]);
    return !negBefore && !GUARANTEE_NEG_AFTER.test(after) && !(verb && GUARANTEE_NEG_LATER.test(clauseAfter(after)));
  });
}

/** Rules applied sentence by sentence to every locale. */
export const CONTENT_RULES = [
  {
    id: "pricing",
    message: "price assertion (currency amount near a cost/fee/price word, or a commercial price pattern)",
    test: (s, ctx) => isPriceAssertion(s, ctx),
  },
  {
    id: "social-proof",
    message: "testimonials, client counts, years of experience or star ratings",
    test: (s) => isSocialProof(s),
  },
  {
    id: "spelled-number",
    message: "figure written in words (write it as digits so parity and grounding can check it)",
    test: (s) => SPELLED_THRESHOLD.test(s),
  },
  {
    id: "our-fees",
    message: "mentions our fees/prices",
    test: (s) => /\b(our|my) (fees?|prices?|rates|pricing)\b|\bnos (honoraires|tarifs|prix)\b|\bunser\w* (honorar\w*|preis\w*|gebühr\w*|tarif\w*)/i.test(s),
  },
  { id: "email", message: "contains an email address", test: (s) => /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(s) },
  {
    id: "guarantee",
    message: "promises a guarantee (guarantee / garanti / garantiert used affirmatively; questions and negations are fine)",
    test: (s) => isGuaranteePromise(s),
  },
  {
    id: "unverified",
    message: "contains an UNVERIFIED marker",
    test: (s) => /unverified|non[- ]vérifié|nicht verifiziert|unverifiziert/i.test(s),
  },
  // STUB (The Valet): topic-specific wording rules (e.g. how regulated services delivered by
  // independent licensed partners may be described, no partner names, no response-time promises)
  // are to be added from the editorial brief.
];

/**
 * @param {string} text
 * @param {{ factIndex?: ReturnType<typeof buildFactIndex> }} [ctx] fact index: lets statutory
 *   amounts stand next to cost words (pricing rule)
 */
export function checkContentRules(text, ctx = {}) {
  const errors = [];
  for (const s of splitSentences(proseOnly(text))) {
    for (const rule of CONTENT_RULES) {
      if (rule.test(s, ctx)) errors.push(`${rule.id}: ${rule.message} — "${s.slice(0, 140)}"`);
    }
  }
  return errors;
}

const GENERIC_KW = new Set(["geneva", "geneve", "suisse", "swiss", "concierge", "conciergerie", "valet"]);

export function keywordCoverage(keyword, text) {
  const kw = tokens(keyword).filter((t) => !GENERIC_KW.has(t));
  if (!kw.length) return 1;
  const hay = new Set(tokens(text));
  return kw.filter((t) => hay.has(t) || [...hay].some((h) => h.startsWith(t.slice(0, 5)))).length / kw.length;
}

// ---------------------------------------------------------------------------
// Keyword stuffing: raw search queries pasted verbatim, meta-talk about "searches"
// ---------------------------------------------------------------------------

/** Words that are capitalised in natural prose (countries, regions, cities, resorts). */
const PROPER_WORDS = {
  en: "swiss french eu uk us usa europe european geneva lausanne montreux gstaad verbier zermatt crans-montana courchevel megève chamonix val-d'isère alps",
  fr: "ue europe france genève lausanne montreux gstaad verbier zermatt crans-montana courchevel megève chamonix val-d'isère alpes",
};
/** Words after which a proper noun reads naturally ("in Geneva", "hors UE"). */
const FUNCTION_WORDS = {
  en: "in to for of from the a an and or with into at as by outside within via across",
  fr: "en de du des la le les l à au aux pour et ou avec dans hors par sur via vers",
};
const wordSet = (s) => new Set(s.split(" "));
const PROPER = Object.fromEntries(Object.entries(PROPER_WORDS).map(([l, s]) => [l, wordSet(s)]));
const FUNCTION = Object.fromEntries(Object.entries(FUNCTION_WORDS).map(([l, s]) => [l, wordSet(s)]));

const kwWords = (kw) => String(kw ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
/** FR "suisse" is a lowercase adjective ("montres suisses") but a capitalised noun after en/la/de ("en Suisse"). */
const isProper = (words, i, locale) =>
  (PROPER[locale] ?? PROPER.en).has(words[i]) || (locale === "fr" && words[i] === "suisse" && i > 0 && ["en", "la", "de", "du", "à"].includes(words[i - 1]));

/**
 * A keyword that cannot be a natural phrase in any casing: a proper noun stacked straight after
 * a content word ("chauffeur geneva", "non eu").
 */
export function isQueryShaped(keyword, locale = "en") {
  const w = kwWords(keyword);
  const fn = FUNCTION[locale] ?? FUNCTION.en;
  return w.some((t, i) => i > 0 && isProper(w, i, locale) && !fn.has(w[i - 1]));
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const WRAP_BEFORE = /(?:\*\*?|__?|["“„«‘'`])\s?$/;
const WRAP_AFTER = /^\s?(?:\*\*?|__?|["”“»’'`])/;
const QUOTE_BEFORE = /["“„«‘]\s?(?:\*\*?|__?)?$/;
const QUOTE_AFTER = /^(?:\*\*?|__?)?\s?["”“»’]/;

/**
 * Raw search queries pasted into the prose. Only keywords of ≥ 4 words are checked. An
 * occurrence is rejected when the keyword is query-shaped (any casing), when it is quoted
 * verbatim (any casing: "people search for “…”"), or when it appears all-lowercase and either contains a word that should be capitalised or is wrapped in bold,
 * italics or quotes. A naturally capitalised, grammatical use of the same words passes.
 * @returns {string[]} one message per offending keyword
 */
export function rawKeywordIssues(text, keywords, locale = "en") {
  const out = [];
  const s = String(text ?? "");
  for (const kw of new Set((keywords ?? []).map((k) => kwWords(k).join(" ")).filter(Boolean))) {
    const w = kw.split(" ");
    if (w.length < 4) continue;
    const shaped = isQueryShaped(kw, locale);
    const hasProper = w.some((_, i) => isProper(w, i, locale));
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${w.map(escapeRe).join("\\s+")}(?![\\p{L}\\p{N}])`, "giu");
    for (const m of s.matchAll(re)) {
      const lower = m[0] === m[0].toLowerCase();
      const wrapped = WRAP_BEFORE.test(s.slice(Math.max(0, m.index - 3), m.index)) && WRAP_AFTER.test(s.slice(m.index + m[0].length, m.index + m[0].length + 3));
      const quoted = QUOTE_BEFORE.test(s.slice(Math.max(0, m.index - 4), m.index)) && QUOTE_AFTER.test(s.slice(m.index + m[0].length, m.index + m[0].length + 4));
      if (shaped || quoted || (lower && (hasProper || wrapped))) {
        const ctx = s.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).replace(/\s+/g, " ").trim();
        out.push(`keyword "${kw}" pasted as a raw search query — write it as natural prose (capitals, hyphens, grammar): "…${ctx}…"`);
        break;
      }
    }
  }
  return out;
}

/** Meta-talk about searches/keywords instead of the topic itself. */
const SEARCH_META = {
  en: [
    /\bsearch(?:es|ed)?\s+(?:like|such as)\b/iu,
    /\bsearch\s+(?:quer(?:y|ies)|terms?|phrases?|intent)\b/iu,
    /\b(?:people|users|many|readers|founders|expats|families)\s+(?:often\s+|commonly\s+|who\s+)?(?:search(?:es|ing)?\s+for|google|googling|look\s+up)\b/iu,
    /\b(?:search(?:es|ing|ed)?|researching|googl(?:e|es|ing|ed)|typ(?:e|es|ing|ed)\s+in(?:to)?)\s+(?:for\s+)?[“"«„‘]/iu,
    /\bgoogle\s+search(?:es)?\b/iu,
    /\bkeywords?\b/iu,
  ],
  fr: [
    /(?<![\p{L}])recherches?\s+(?:comme|du type|de type|telles? que|google|en ligne)(?![\p{L}])/iu,
    /(?<![\p{L}])requêtes?\s+(?:de recherche|comme|google|du type|telles? que)(?![\p{L}])/iu,
    /(?<![\p{L}])(?:recherchent|recherchez|tapent|tapez|googlent|googlez|cherchent sur google)\s+[«“"„]/iu,
    /(?<![\p{L}])internautes(?![\p{L}])/iu,
    /(?<![\p{L}])mots?[- ]clés?(?![\p{L}])/iu,
  ],
};

/** @returns {string[]} one message per meta-phrase about searches found in `text` */
export function searchMetaIssues(text, locale = "en") {
  const out = [];
  const s = String(text ?? "");
  for (const re of SEARCH_META[locale] ?? SEARCH_META.en) {
    const m = s.match(re);
    if (m) {
      const ctx = s.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).replace(/\s+/g, " ").trim();
      out.push(`talks about searches/keywords ("${m[0].trim()}") — write about the topic, not about what people search: "…${ctx}…"`);
    }
  }
  return out;
}

/**
 * Guardrails for one locale of the new journal article.
 * Frontmatter accepted by the site: title, description, translationKey, updated (YYYY-MM-DD),
 * published (optional), draft, faq [{q,a}] (optional), sources [{label,url}],
 * keywords {primary, secondary[]} (optional), service (optional: a service translationKey).
 * @param {{ data: object, body: string }} article
 * @param {object} ctx { locale, slug, allowedLinks: Set<string>, wordRange: [min,max],
 *   factIndex?: buildFactIndex(corpus) — lets fact-base amounts stand next to cost words }
 */
export function checkArticle(article, ctx) {
  const { locale, slug, allowedLinks } = ctx;
  const { data, body } = article;
  const errors = [];
  const e = (msg) => errors.push(`${locale}: ${msg}`);

  // Frontmatter completeness
  for (const f of ["title", "description", "translationKey", "updated"]) {
    if (!data[f]) e(`frontmatter "${f}" missing`);
  }
  const updated = data.updated instanceof Date ? data.updated.toISOString().slice(0, 10) : data.updated;
  if (updated && !/^\d{4}-\d{2}-\d{2}$/.test(String(updated))) e(`"updated" must be YYYY-MM-DD`);
  if (data.translationKey !== slug) e(`translationKey must be "${slug}"`);
  if (data.draft !== false) e(`draft must be false`);
  if (data.service !== undefined && (typeof data.service !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.service)))
    e(`service must be a service translationKey (lower-case-kebab)`);
  const faq = Array.isArray(data.faq) ? data.faq : [];
  if (faq.length < 4 || faq.length > 6) e(`faq must have 4–6 items (has ${faq.length})`);
  faq.forEach((f, i) => {
    if (!f?.q || !f?.a) e(`faq[${i}] needs q and a`);
    else if (startsWithLowercase(f.q)) e(`faq[${i}].q starts with a lowercase letter: "${f.q}"`);
  });
  const kw = data.keywords;
  if (!kw || typeof kw.primary !== "string" || !kw.primary.trim()) e(`keywords.primary missing`);
  if (!Array.isArray(kw?.secondary) || kw.secondary.length < 5 || kw.secondary.length > 10 || kw.secondary.some((s) => typeof s !== "string" || !s.trim()))
    e(`keywords.secondary must be 5–10 strings`);

  // Meta lengths
  const title = String(data.title ?? "");
  const desc = String(data.description ?? "");
  if (title.length > 60) e(`title is ${title.length} chars (max 60)`);
  if (desc.length < 140 || desc.length > 155) e(`description is ${desc.length} chars (140–155)`);
  if (startsWithLowercase(title)) e(`title starts with a lowercase letter: "${title}"`);
  if (startsWithLowercase(desc)) e(`description starts with a lowercase letter: "${desc}"`);

  // Length
  const words = countWords(body);
  const [min, max] = ctx.wordRange ?? (locale === SOURCE_LOCALE ? [1100, 2000] : [950, 2400]);
  if (words < min || words > max) e(`body has ${words} words (${min}–${max})`);

  // Structure
  if (/^#\s/m.test(body)) e(`body must not contain an H1 (the page renders the title)`);
  const kfIdx = body.search(PATTERNS.keyFacts[locale]);
  if (kfIdx < 0 || kfIdx > body.length * 0.3) e(`"Key facts" box missing near the top`);
  const questionH2 = (body.match(/^##\s+[^\n]*\?\s*$/gm) ?? []).length;
  if (questionH2 < 2) e(`needs at least 2 question-style H2s (has ${questionH2})`);
  for (const m of body.matchAll(/^##(?!#)\s+(.*)$/gm)) {
    if (startsWithLowercase(m[1])) e(`H2 heading starts with a lowercase letter: "${m[1]}"`);
  }
  if (!PATTERNS.howWeHelp[locale].test(body)) e(`"How we help" section missing`);
  const lastLine = body.trim().split("\n").filter((l) => l.trim()).pop() ?? "";
  if (!PATTERNS.disclaimer[locale].test(lastLine)) e(`must end with the "general information" disclaimer line`);

  // Internal links
  const { internal, external, other } = extractLinks(body);
  for (const href of other) e(`link "${href}" must be an internal path (/${locale}/…) or an https URL`);
  const norm = (h) => {
    let p = h.split(/[?#]/)[0];
    if (!p.endsWith("/")) p += "/";
    return p;
  };
  const self = `/${locale}/${COLLECTION}/${slug}/`;
  const distinct = new Set();
  for (const href of internal) {
    const p = norm(href);
    if (!p.startsWith(`/${locale}/`)) e(`internal link "${href}" is not in /${locale}/`);
    else if (p === self) e(`links to itself`);
    else if (!allowedLinks.has(p)) e(`internal link "${href}" does not resolve to an existing page`);
    else distinct.add(p);
  }
  if (distinct.size < 3) e(`needs at least 3 distinct internal links (has ${distinct.size})`);
  if (CTA_PATH_RE && ![...distinct].some((p) => CTA_PATH_RE.test(p))) e(`needs a CTA link (${CTA_PATH_RE})`);

  // Sources policy
  const sources = Array.isArray(data.sources) ? data.sources : [];
  let official = 0;
  sources.forEach((s, i) => {
    if (!s?.label || !/^https?:\/\//.test(s?.url ?? "")) return e(`sources[${i}] needs label and absolute url`);
    const c = classifySource(s.url);
    if (c === "official") official++;
    else if (c !== "institutional") e(`sources[${i}] ${s.url} is ${c} by the source policy`);
  });
  if (sources.length < 3) e(`needs at least 3 sources (has ${sources.length})`);
  if (official < 2) e(`needs at least 2 official sources (has ${official})`);
  for (const url of external) {
    const c = classifySource(url);
    if (c !== "official" && c !== "institutional") e(`body links to ${url} (${c} by the source policy)`);
  }

  // Wording rules
  const allText = `${title}\n${desc}\n${body}\n${faq.map((f) => `${f.q}\n${f.a}`).join("\n")}`;
  for (const err of checkContentRules(allText, { factIndex: ctx.factIndex })) e(err);
  if (/\bTODO\b|lorem/i.test(allText)) e(`contains TODO/lorem`);
  for (const err of rawKeywordIssues(allText, [kw?.primary, ...(Array.isArray(kw?.secondary) ? kw.secondary : [])], locale)) e(err);
  for (const err of searchMetaIssues(allText, locale)) e(err);

  // Keywords in the right places
  if (kw?.primary) {
    if (keywordCoverage(kw.primary, `${title} ${desc}`) < 0.5) e(`primary keyword "${kw.primary}" not reflected in title/description`);
    if (keywordCoverage(kw.primary, body) < 0.75) e(`primary keyword "${kw.primary}" not used in the body`);
    if (locale === SOURCE_LOCALE && keywordCoverage(kw.primary, slug.replace(/-/g, " ")) === 0)
      e(`slug "${slug}" shares no term with primary keyword "${kw.primary}"`);
  }
  return errors;
}

/**
 * Cross-locale checks: same service/sources count/faq count, number parity, grounded numbers.
 * Pass `factsCorpus` (text) or a prebuilt `factIndex` to enable grounding.
 */
export function checkArticleSet(articles, { factsCorpus = "", factIndex = null, unverifiedNumbers = new Set() } = {}) {
  const errors = [];
  const src = SOURCE_LOCALE;
  const base = articles[src];
  if (!base) return [`${src}: source article missing`];
  for (const l of TARGET_LOCALES) {
    const a = articles[l];
    if (!a) {
      errors.push(`${l}: translation missing`);
      continue;
    }
    if ((a.data.service ?? null) !== (base.data.service ?? null)) errors.push(`${l}: service differs from ${src}`);
    if ((a.data.faq ?? []).length !== (base.data.faq ?? []).length) errors.push(`${l}: faq count differs from ${src}`);
    if ((a.data.sources ?? []).length !== (base.data.sources ?? []).length) errors.push(`${l}: sources count differs from ${src}`);
    const h2 = (b) => (b.match(/^##\s/gm) ?? []).length;
    if (h2(a.body) !== h2(base.body)) errors.push(`${l}: H2 count ${h2(a.body)} differs from ${src} (${h2(base.body)})`);
  }
  errors.push(...checkNumberParity(articles));

  // Title/description may be phrased differently per language, but must not introduce figures
  // that the article itself does not contain.
  const baseNumbers = extractNumbers(articleNumberText(base), src);
  for (const l of LOCALES) {
    if (!articles[l]) continue;
    const extra = [...extractFigures(metaText(articles[l]), l)].filter((n) => !baseNumbers.has(n));
    if (extra.length) errors.push(`${l}: title/description has figures not in the article: ${extra.join(", ")}`);
  }

  const text = `${articleNumberText(base)}\n${metaText(base)}`;
  const index = factIndex ?? (factsCorpus ? buildFactIndex(factsCorpus) : null);
  if (index) {
    // Every compliance-relevant number (amounts, rates, multipliers, durations, counts, dates)
    // must come from the fact base; only citation numbers and source/as-of dates are exempt.
    for (const l of LOCALES) {
      const a = articles[l];
      if (!a) continue;
      const updated = a.data.updated instanceof Date ? a.data.updated.toISOString().slice(0, 10) : a.data.updated;
      const bad = ungroundedNumbers(`${articleNumberText(a)}\n${metaText(a)}`, l, index, { asOf: updated });
      const seen = new Set();
      const list = bad
        .filter((b) => !seen.has(`${b.unit}:${b.value}`) && seen.add(`${b.unit}:${b.value}`))
        .map((b) => `${b.value} (${b.unit}, "${b.raw}")`);
      if (list.length) errors.push(`${l}: numbers not found in the fact base or verified research (value and unit must match): ${list.join(", ")}`);
    }
  }
  const bad = [...extractNumbers(text, src)].filter((n) => unverifiedNumbers.has(n));
  if (bad.length) errors.push(`${src}: uses numbers that the fact base marks UNVERIFIED: ${bad.join(", ")}`);
  return errors;
}

// ---------------------------------------------------------------------------
// Serialisation
// ---------------------------------------------------------------------------

const q = (s) => JSON.stringify(String(s)); // JSON strings are valid YAML double-quoted scalars

/** Path of one locale of a journal article: content/<locale>/journal/<slug>.md */
export function articlePath(root, locale, slug) {
  return path.join(root, "content", locale, COLLECTION, `${slug}.md`);
}

/** Journal frontmatter, in the shape the site accepts (see checkArticle). */
export function serializeArticle(data, body) {
  const kw = data.keywords;
  const lines = [
    "---",
    `title: ${q(data.title)}`,
    `description: ${q(data.description)}`,
    `translationKey: ${q(data.translationKey)}`,
    `updated: ${q(data.updated)}`,
    ...(data.published ? [`published: ${q(data.published)}`] : []),
    `draft: false`,
    ...(data.service ? [`service: ${q(data.service)}`] : []),
    ...(kw?.primary
      ? [`keywords:`, `  primary: ${q(kw.primary)}`, `  secondary:`, ...(kw.secondary ?? []).map((k) => `    - ${q(k)}`)]
      : []),
    ...(Array.isArray(data.faq) && data.faq.length ? [`faq:`, ...data.faq.flatMap((f) => [`  - q: ${q(f.q)}`, `    a: ${q(f.a)}`])] : []),
    `sources:`,
    ...(data.sources ?? []).flatMap((s) => [`  - label: ${q(s.label)}`, `    url: ${q(s.url)}`]),
    "---",
    "",
  ];
  return `${lines.join("\n")}${String(body).trim()}\n`;
}

export function readArticle(root, locale, slug) {
  const file = articlePath(root, locale, slug);
  if (!fs.existsSync(file)) return null;
  const parsed = matter(fs.readFileSync(file, "utf8"));
  return { data: parsed.data, body: parsed.content, file };
}
