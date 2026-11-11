import { getPublishedEntries } from "./content";
import { t, type Locale } from "./i18n";
import { localePath, pagePath } from "./paths";

export type NavLink = { href: string; label: string };

/** Published services in display order, as links. */
export function serviceLinks(locale: Locale): (NavLink & { key: string; summary: string })[] {
  return getPublishedEntries(locale, "services").map((e) => ({
    key: e.translationKey,
    href: localePath(locale, `/services/${e.slug}/`),
    label: e.title,
    summary: e.summary,
  }));
}

/** Short labels for menus (titles are SEO-length). */
export function shortServiceLabel(locale: Locale, key: string, fallback: string): string {
  const fr: Record<string, string> = {
    concierge: "Conciergerie",
    chauffeur: "Transports et logistique",
    "alpine-transfers": "Transferts",
    "child-transport": "Transport d'enfants",
    "residence-management": "Intendance de résidence",
    chalets: "Location de résidence",
    events: "Événement",
    "glam-team": "Glam Team",
    medical: "Conciergerie médicale",
    security: "Sécurité",
    "legal-real-estate": "Juridique",
    "real-estate": "Immobilier",
  };
  const en: Record<string, string> = {
    concierge: "Concierge",
    chauffeur: "Transport and logistics",
    "alpine-transfers": "Transfers",
    "child-transport": "Child transport",
    "residence-management": "Residence management",
    chalets: "Residence rental",
    events: "Event",
    "glam-team": "Glam Team",
    medical: "Medical concierge",
    security: "Security",
    "legal-real-estate": "Legal",
    "real-estate": "Real estate",
  };
  const label = (locale === "fr" ? fr : en)[key] ?? fallback;
  return locale === "fr" ? label.replace(/'/g, "’") : label;
}

export function menuServices(locale: Locale): NavLink[] {
  return serviceLinks(locale).map((s) => ({ href: s.href, label: shortServiceLabel(locale, s.key, s.label) }));
}

export function mainLinks(locale: Locale): NavLink[] {
  return [
    { href: pagePath(locale, "about"), label: t(locale, "nav.about") },
    { href: pagePath(locale, "faq"), label: t(locale, "nav.faq") },
    { href: pagePath(locale, "contact"), label: t(locale, "nav.contact") },
  ];
}
