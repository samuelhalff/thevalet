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
    concierge: "Conciergerie privée",
    chauffeur: "Chauffeur privé",
    "alpine-transfers": "Transferts Genève–Alpes",
    "child-transport": "Transport d'enfants",
    "residence-management": "Intendance de résidence",
    chalets: "Chalets et résidences",
    events: "Mariages et événements",
    "glam-team": "Glam Team",
    medical: "Conciergerie médicale",
    security: "Sécurité et protection",
    "legal-real-estate": "Juridique et immobilier",
  };
  const en: Record<string, string> = {
    concierge: "Private concierge",
    chauffeur: "Private chauffeur",
    "alpine-transfers": "Geneva–Alps transfers",
    "child-transport": "Child transport",
    "residence-management": "Residence management",
    chalets: "Chalets and residences",
    events: "Weddings and events",
    "glam-team": "Glam Team",
    medical: "Medical concierge",
    security: "Security and protection",
    "legal-real-estate": "Legal and real estate",
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
