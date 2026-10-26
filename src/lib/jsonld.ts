import type { Entry } from "./content";
import { business, hasAddress, AREAS_SERVED } from "./business";
import { type Locale } from "./i18n";
import { absoluteUrl, localePath } from "./paths";
import { SITE_NAME, SITE_URL } from "./site";

const ORG_ID = `${SITE_URL}/#org`;
const SITE_ID = `${SITE_URL}/#website`;

export function areaServedLd(locale: Locale) {
  return AREAS_SERVED.map((a) => ({ "@type": a.type, name: a[locale] }));
}

/** Organization + LocalBusiness. Contact and address fields only when configured; sameAs only verified profiles. */
export function organizationLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": ORG_ID,
    name: SITE_NAME,
    ...(business.legalName ? { legalName: business.legalName } : {}),
    url: `${SITE_URL}/`,
    logo: absoluteUrl("/logo.svg"),
    image: absoluteUrl("/og.png"),
    slogan: locale === "fr" ? "Chaque souhait devient une réalité." : "Every wish, made real.",
    description:
      locale === "fr"
        ? "Conciergerie haut de gamme à Genève et dans les Alpes : chauffeur privé, transferts, conciergerie privée, intendance de résidence, chalets, événements, Glam Team ; services réglementés coordonnés avec des partenaires indépendants, choisis pour leur activité autorisée."
        : "Premium concierge in Geneva and the Alps: private chauffeur, transfers, private concierge, residence management, chalets, events and Glam Team; regulated services coordinated with independent partners, chosen for their authorised activity.",
    areaServed: areaServedLd(locale),
    knowsLanguage: ["fr", "en"],
    ...(business.phone ? { telephone: business.phone } : {}),
    ...(business.email ? { email: business.email } : {}),
    ...(business.uid ? { taxID: business.uid } : {}),
    ...(hasAddress
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: business.street,
            postalCode: business.postalCode || undefined,
            addressLocality: business.city,
            addressCountry: business.country,
          },
        }
      : {}),
    sameAs: business.sameAs,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["French", "English"],
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "00:00",
        closes: "23:59",
      },
      ...(business.phone ? { telephone: business.phone } : {}),
    },
  };
}

export function websiteLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: SITE_NAME,
    url: absoluteUrl(localePath(locale, "/")),
    inLanguage: locale,
    publisher: { "@id": ORG_ID },
  };
}

export type Crumb = { name: string; path: string };

/** Crumbs carry locale-prefixed paths. */
export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function serviceLd(entry: Entry, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: entry.title,
    description: entry.description,
    url,
    inLanguage: entry.locale,
    serviceType: entry.serviceType || entry.title,
    provider: { "@id": ORG_ID },
    areaServed: areaServedLd(entry.locale),
    availableChannel: { "@type": "ServiceChannel", serviceUrl: url },
  };
}

export function articleLd(entry: Entry, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    description: entry.description,
    inLanguage: entry.locale,
    mainEntityOfPage: url,
    image: absoluteUrl("/og.png"),
    datePublished: entry.published || entry.updated,
    dateModified: entry.updated,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    ...(entry.sources.length ? { citation: entry.sources.map((s) => s.url) } : {}),
    ...(entry.keywords
      ? { keywords: [entry.keywords.primary, ...entry.keywords.secondary].join(", "), about: { "@type": "Thing", name: entry.keywords.primary } }
      : {}),
  };
}

export function faqLd(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
