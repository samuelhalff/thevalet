#!/usr/bin/env node
/**
 * Submit URLs to IndexNow (Bing, Yandex, Seznam, Naver…). Best effort: never exits non-zero
 * unless --strict is passed.
 *
 *   node scripts/indexnow.mjs --slug <journal-slug>      # FR/EN journal article + journal index pages
 *   node scripts/indexnow.mjs https://…/fr/ https://…/en/ # explicit URLs
 *
 * Key: INDEXNOW_KEY env only. If unset, the script logs a message and exits 0 (no key file is
 * committed; when a key is adopted, deploy public/<key>.txt at the site root so it verifies).
 * Site: NEXT_PUBLIC_SITE_URL (default https://thevalet.ch).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

export function findKey(env = process.env) {
  const key = (env.INDEXNOW_KEY || "").trim();
  return key || null;
}

export function journalUrls(site, slug) {
  return ["fr", "en"].flatMap((l) => [`${site}/${l}/journal/${slug}/`, `${site}/${l}/journal/`]);
}

async function main() {
  const args = process.argv.slice(2);
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://thevalet.ch").replace(/\/$/, "");
  const i = args.indexOf("--slug");
  const urls = i >= 0 ? journalUrls(site, args[i + 1]) : args.filter((a) => /^https?:\/\//.test(a));
  const strict = args.includes("--strict");
  const key = findKey();
  if (!key) {
    console.log("IndexNow skipped: INDEXNOW_KEY is not set.");
    process.exit(0);
  }
  if (!urls.length) {
    console.log(`IndexNow skipped (no URLs).`);
    process.exit(strict ? 1 : 0);
  }
  const host = new URL(site).host;
  const body = JSON.stringify({ host, key, keyLocation: `${site}/${key}.txt`, urlList: urls });
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body,
      signal: AbortSignal.timeout(20000),
    });
    console.log(`IndexNow ${res.status} for ${urls.length} URL(s): ${(await res.text()).slice(0, 300)}`);
    if (strict && !(res.status >= 200 && res.status < 300)) process.exit(1);
  } catch (err) {
    console.log(`IndexNow error: ${err.message}`);
    if (strict) process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
