import type { Locale } from "./i18n";
import { SITE_URL } from "./site";
import staticRoutes from "./static-routes.json";

/** Locale-less path like "/services/foo/" → "/fr/services/foo/". Paths always end with "/". */
export function localePath(locale: Locale, path = "/"): string {
  const clean = ("/" + path.replace(/^\/+/, "")).replace(/\/?$/, "/");
  return `/${locale}${clean === "/" ? "/" : clean}`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Collection name → URL segment (identical in both locales). */
export const collectionBase = {
  services: "services",
  journal: "journal",
} as const;

export type PageKey = Exclude<keyof typeof staticRoutes.pages, "_comment">;
type RouteDef = { fr: string; en: string; catchAll?: boolean };
export const pageRoutes = staticRoutes.pages as Record<PageKey, RouteDef>;
export const pageKeys = Object.keys(pageRoutes) as PageKey[];

/** Locale-less path of a fixed page, e.g. ("fr", "about") → "/a-propos/". */
export function pageSlug(locale: Locale, key: PageKey): string {
  return pageRoutes[key][locale];
}

/** Full path of a fixed page, e.g. ("fr", "about") → "/fr/a-propos/". */
export function pagePath(locale: Locale, key: PageKey): string {
  return localePath(locale, pageSlug(locale, key));
}

/** Per-locale locale-less paths of a fixed page (for hreflang). */
export function pageAlternates(key: PageKey): Record<Locale, string> {
  const r = pageRoutes[key];
  return { fr: r.fr, en: r.en };
}

/** Request builder URL with an optional service pre-selected. */
export function requestPath(locale: Locale, serviceKey?: string): string {
  return pagePath(locale, "request") + (serviceKey ? `?service=${encodeURIComponent(serviceKey)}` : "");
}
