import pagesFr from "@/i18n/pages.fr.json";
import pagesEn from "@/i18n/pages.en.json";
import legalFr from "@/i18n/legal.fr.json";
import legalEn from "@/i18n/legal.en.json";
import type { Locale } from "./i18n";
import { typeset } from "./typography";

/** Long-form copy of the fixed pages (src/i18n/pages.<locale>.json), French typography applied. */
export type PagesCopy = typeof pagesFr;
export type LegalCopy = typeof legalFr;
export type LegalDoc = LegalCopy["privacy"];

function typesetDeep<T>(locale: Locale, value: T): T {
  if (typeof value === "string") return typeset(locale, value) as T;
  if (Array.isArray(value)) return value.map((v) => typesetDeep(locale, v)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, typesetDeep(locale, v)])) as T;
  }
  return value;
}

const pages: Record<Locale, PagesCopy> = { fr: typesetDeep("fr", pagesFr), en: pagesEn as PagesCopy };
const legal: Record<Locale, LegalCopy> = { fr: typesetDeep("fr", legalFr), en: legalEn as LegalCopy };

export function pagesCopy(locale: Locale): PagesCopy {
  return pages[locale];
}

export function legalCopy(locale: Locale): LegalCopy {
  return legal[locale];
}
