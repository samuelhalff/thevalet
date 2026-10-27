/**
 * Build-time site settings. Everything public comes from NEXT_PUBLIC_* env vars; nothing here
 * falls back to a real-looking value. Business details (phone, email, address, entity) live in
 * src/lib/business.ts and render nothing while empty.
 */
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
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
/** Formspark form id: env only, no default (forms show a fallback panel while empty). */
export const FORMSPARK_ID = process.env.NEXT_PUBLIC_FORMSPARK_ID || "";
export const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/[^\d]/g, "");
export const SITE_NAME = "The Valet";

export const whatsappUrl = WHATSAPP ? `https://wa.me/${WHATSAPP}` : "";
