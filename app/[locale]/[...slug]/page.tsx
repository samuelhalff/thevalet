import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, t, type Locale } from "@/lib/i18n";
import { legalCopy, pagesCopy } from "@/lib/copy";
import { pageKeys, pageRoutes, pageSlug, type PageKey } from "@/lib/paths";
import { fixedPageMetadata } from "@/lib/page";
import AboutView from "@/components/pages/AboutView";
import FaqView from "@/components/pages/FaqView";
import ContactView from "@/components/pages/ContactView";
import RequestView from "@/components/pages/RequestView";
import LegalView from "@/components/pages/LegalView";

/**
 * Fixed pages whose slug differs per locale (static-routes.json, catchAll: true):
 * /fr/a-propos/ ↔ /en/about/, /fr/demande/ ↔ /en/request/, …
 */
type Params = Promise<{ locale: string; slug: string[] }>;
type CatchAllKey = "about" | "faq" | "contact" | "request" | "privacy" | "legal" | "terms";

const catchAllKeys = pageKeys.filter((k) => pageRoutes[k].catchAll) as CatchAllKey[];

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = (isLocale(params.locale) ? params.locale : "fr") as Locale;
  return catchAllKeys.map((k) => ({ slug: pageSlug(locale, k).split("/").filter(Boolean) }));
}

async function resolve(params: Params): Promise<{ locale: Locale; key: CatchAllKey } | null> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return null;
  const path = `/${slug.join("/")}/`;
  const key = catchAllKeys.find((k) => pageSlug(locale, k) === path);
  return key ? { locale, key } : null;
}

function meta(locale: Locale, key: CatchAllKey): { title: string; description: string } {
  if (key === "privacy" || key === "legal" || key === "terms") {
    const d = legalCopy(locale)[key];
    return { title: d.metaTitle, description: d.metaDescription };
  }
  const p = pagesCopy(locale)[key];
  return { title: p.metaTitle, description: p.metaDescription };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const r = await resolve(params);
  if (!r) return {};
  const m = meta(r.locale, r.key);
  return fixedPageMetadata(r.locale, r.key as PageKey, m.title, m.description);
}

export default async function FixedPage({ params }: { params: Params }) {
  const r = await resolve(params);
  if (!r) notFound();
  const { locale, key } = r;
  switch (key) {
    case "about":
      return <AboutView locale={locale} />;
    case "faq":
      return <FaqView locale={locale} />;
    case "contact":
      return <ContactView locale={locale} />;
    case "request":
      return <RequestView locale={locale} />;
    default:
      return <LegalView locale={locale} doc={key} label={t(locale, `nav.${key}`)} />;
  }
}
