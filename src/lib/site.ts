/**
 * Build-time site settings. Owner-editable values (WhatsApp, form and analytics ids) come from
 * content/settings.json, overridden by a non-empty NEXT_PUBLIC_* env var; nothing falls back to a
 * real-looking value. Business details (phone, email, address, entity) live in
 * src/lib/business.ts and render nothing while empty.
 */
import settings from "../../content/settings.json";

const fromEnv = (key: string, fallback: string) => (process.env[key] || "").trim() || fallback.trim();

export const PRODUCTION_URL = "https://thevalet.ch";

/** Hosts a build may target: production (apex or www), local dev, and preview hosts. */
export function isAllowedSiteUrl(url: string): boolean {
  let host: string;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    host = u.hostname;
  } catch {
    return false;
  }
  return (
    host === "thevalet.ch" ||
    host === "www.thevalet.ch" ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    /^[a-z0-9-]+\.thevalet\.ch$/.test(host)
  );
}

function resolveSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_URL).replace(/\/+$/, "");
  if (!isAllowedSiteUrl(raw)) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL="${raw}" is not thevalet.ch, a *.thevalet.ch preview host or localhost.`,
    );
  }
  return raw;
}

export const SITE_URL = resolveSiteUrl();
export const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === "true";
export const GA_ID = fromEnv("NEXT_PUBLIC_GA_ID", settings.googleAnalyticsId);
/** Formspark form id, no default (forms show a fallback panel while empty). */
export const FORMSPARK_ID = fromEnv("NEXT_PUBLIC_FORMSPARK_ID", settings.formsparkId);
export const WHATSAPP = fromEnv("NEXT_PUBLIC_WHATSAPP", settings.whatsapp).replace(/[^\d]/g, "");
export const SITE_NAME = "The Valet";

export const whatsappUrl = WHATSAPP ? `https://wa.me/${WHATSAPP}` : "";
