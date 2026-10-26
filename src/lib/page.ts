import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./i18n";
import { pageAlternates, pageSlug, type PageKey } from "./paths";
import { pageMetadata } from "./seo";

export type LocaleParams = Promise<{ locale: string }>;

export async function getLocale(params: LocaleParams): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

/** Metadata for a fixed page (localized path + reciprocal hreflang from static-routes.json). */
export function fixedPageMetadata(
  locale: Locale,
  key: PageKey,
  title: string,
  description: string,
  opts: { noindex?: boolean; absoluteTitle?: boolean } = {},
): Metadata {
  return pageMetadata({
    locale,
    path: pageSlug(locale, key),
    title,
    description,
    alternates: pageAlternates(key),
    noindex: opts.noindex,
    absoluteTitle: opts.absoluteTitle,
  });
}
