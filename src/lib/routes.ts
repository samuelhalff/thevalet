import { collections, getPublishedEntries, getTranslations } from "./content";
import { locales, type Locale } from "./i18n";
import { collectionBase, pageAlternates, pageKeys, type PageKey } from "./paths";

export type IndexablePage = {
  /** Per-locale locale-less path for this page (hreflang group). */
  paths: Partial<Record<Locale, string>>;
  lastModified?: string;
};

/** Fixed pages left out of the sitemap while they have nothing to show. */
function isThin(key: PageKey): boolean {
  return key === "journal" && locales.every((l) => getPublishedEntries(l, "journal").length === 0);
}

/** Every indexable page, grouped across languages. Drafts are excluded. */
export function indexablePages(): IndexablePage[] {
  const pages: IndexablePage[] = pageKeys.filter((k) => !isThin(k)).map((k) => ({ paths: pageAlternates(k) }));

  for (const collection of collections) {
    const seen = new Set<string>();
    for (const locale of locales) {
      for (const entry of getPublishedEntries(locale, collection)) {
        if (seen.has(entry.translationKey)) continue;
        seen.add(entry.translationKey);
        const paths: Partial<Record<Locale, string>> = {};
        let lastModified = entry.updated;
        for (const [loc, tr] of Object.entries(getTranslations(entry)) as [Locale, typeof entry][]) {
          if (tr.draft) continue;
          paths[loc] = `/${collectionBase[collection]}/${tr.slug}/`;
          if (tr.updated > lastModified) lastModified = tr.updated;
        }
        pages.push({ paths, lastModified });
      }
    }
  }
  return pages;
}

export { isThin };
