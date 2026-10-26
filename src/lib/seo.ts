import type { Metadata } from "next";
import { locales, t, type Locale } from "./i18n";
import { absoluteUrl, localePath } from "./paths";
import { NOINDEX, SITE_NAME } from "./site";

type PageMetaInput = {
  locale: Locale;
  /** Locale-less path, e.g. "/guides/my-guide/". */
  path: string;
  title: string;
  description: string;
  /** Set true for drafts or thin pages. NEXT_PUBLIC_NOINDEX forces noindex regardless. */
  noindex?: boolean;
  /**
   * Per-locale paths for hreflang when they differ or when a translation is missing.
   * Defaults to the same path in every locale. Missing locales are omitted (hreflang only where both versions exist).
   */
  alternates?: Partial<Record<Locale, string>>;
  /** Use the title as-is (no "| The Valet" suffix). */
  absoluteTitle?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export function languageAlternates(paths: Partial<Record<Locale, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const loc of locales) {
    const p = paths[loc];
    if (p) out[loc] = absoluteUrl(localePath(loc, p));
  }
  // "/" negotiates the language (FR fallback) and is the x-default of the home page; other
  // pages use the French version (the default locale) when it exists.
  if (paths.fr === "/" && paths.en === "/") out["x-default"] = absoluteUrl("/");
  else if (paths.fr) out["x-default"] = absoluteUrl(localePath("fr", paths.fr));
  return out;
}

export function pageMetadata(input: PageMetaInput): Metadata {
  const { locale, path, title, description } = input;
  const url = absoluteUrl(localePath(locale, path));
  const alternatePaths = input.alternates ?? Object.fromEntries(locales.map((l) => [l, path]));
  const single = Object.values(alternatePaths).filter(Boolean).length < 2;
  const noindex = NOINDEX || input.noindex;
  const fullTitle = input.absoluteTitle ? title : `${title} | ${SITE_NAME}`;

  return {
    title: { absolute: fullTitle },
    description,
    // Self-canonical; reciprocal hreflang only when both language versions exist.
    alternates: { canonical: url, ...(single ? {} : { languages: languageAlternates(alternatePaths) }) },
    robots: noindex ? { index: false, follow: !NOINDEX } : { index: true, follow: true },
    openGraph: {
      type: input.type ?? "website",
      url,
      title: fullTitle,
      description,
      siteName: SITE_NAME,
      locale: t(locale, "meta.ogLocale"),
      images: [{ url: absoluteUrl("/og.png"), width: 1200, height: 630, alt: SITE_NAME }],
      ...(input.type === "article"
        ? { publishedTime: input.publishedTime, modifiedTime: input.modifiedTime }
        : {}),
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [absoluteUrl("/og.png")] },
  };
}
