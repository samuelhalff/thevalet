import type { Metadata } from "next";
import { getAllEntries, getEntry, getTranslations, type Collection } from "./content";
import { isLocale, locales, type Locale } from "./i18n";
import { collectionBase } from "./paths";
import { pageMetadata } from "./seo";

export type EntryParams = Promise<{ locale: string; slug: string }>;

export function entryPath(collection: Collection, slug: string): string {
  return `/${collectionBase[collection]}/${slug}/`;
}

/** Shared generateStaticParams for app/[locale]/<collection>/[slug]. */
export function entryStaticParams(collection: Collection) {
  return async ({ params }: { params: { locale: string } }) => {
    const locale = isLocale(params.locale) ? params.locale : "fr";
    const entries = getAllEntries(locale, collection).map((e) => ({ slug: e.slug }));
    // Static export needs at least one param; "_" renders a 404 (see resolveEntry).
    return entries.length ? entries : [{ slug: "_" }];
  };
}

export async function resolveEntry(collection: Collection, params: EntryParams) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return null;
  const entry = getEntry(locale, collection, slug);
  return entry ? { locale: locale as Locale, entry } : null;
}

/** Per-locale paths of an entry's published translations (the entry itself always included). */
export function entryAlternates(collection: Collection, locale: Locale, entry: ReturnType<typeof getEntry> & object) {
  const alternates: Partial<Record<Locale, string>> = {};
  const translations = getTranslations(entry);
  for (const loc of locales) {
    const tr = translations[loc];
    if (tr && (!tr.draft || loc === locale)) alternates[loc] = entryPath(collection, tr.slug);
  }
  return alternates;
}

export function entryMetadata(collection: Collection) {
  return async ({ params }: { params: EntryParams }): Promise<Metadata> => {
    const r = await resolveEntry(collection, params);
    if (!r) return { robots: { index: false, follow: false } };
    const { locale, entry } = r;
    return pageMetadata({
      locale,
      path: entryPath(collection, entry.slug),
      title: entry.title,
      description: entry.description,
      noindex: entry.draft,
      alternates: entryAlternates(collection, locale, entry),
      type: collection === "journal" ? "article" : "website",
      publishedTime: entry.published || entry.updated,
      modifiedTime: entry.updated,
    });
  };
}
