/**
 * Business details, all from env (NEXT_PUBLIC_*), all optional. While a value is empty the
 * site renders nothing for it (no placeholder text, no fake number) and JSON-LD omits it.
 * Set them in .env.local / the deploy variables once the client confirms them.
 */
const env = (key: string) => (process.env[key] || "").trim();

export const business = {
  /** Registered legal name, e.g. "The Valet Sàrl" (unknown yet). */
  legalName: env("NEXT_PUBLIC_COMPANY_NAME"),
  /** Commercial register UID, e.g. "CHE-123.456.789". */
  uid: env("NEXT_PUBLIC_COMPANY_UID"),
  street: env("NEXT_PUBLIC_COMPANY_STREET"),
  postalCode: env("NEXT_PUBLIC_COMPANY_POSTCODE"),
  city: env("NEXT_PUBLIC_COMPANY_CITY"),
  /** ISO country code; defaults to CH only when an address is given. */
  country: env("NEXT_PUBLIC_COMPANY_COUNTRY") || "CH",
  /** Public phone in international format, e.g. "+41 22 000 00 00". */
  phone: env("NEXT_PUBLIC_CONTACT_PHONE"),
  email: env("NEXT_PUBLIC_CONTACT_EMAIL"),
  /** Person or role responsible for the website content (legal notice). */
  responsible: env("NEXT_PUBLIC_COMPANY_RESPONSIBLE"),
  /** Hosting provider name and country for the privacy policy, e.g. "Infomaniak (Switzerland)". */
  hosting: env("NEXT_PUBLIC_HOSTING_PROVIDER"),
  /** Verified public profiles only (comma-separated URLs): Instagram, LinkedIn, Google Business Profile. */
  sameAs: env("NEXT_PUBLIC_SAME_AS")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^https:\/\//.test(s)),
};

export const hasAddress = Boolean(business.street && business.city);

/** "tel:" href from a display number ("" when not configured). */
export const phoneHref = business.phone ? `tel:${business.phone.replace(/[^\d+]/g, "")}` : "";
export const emailHref = business.email ? `mailto:${business.email}` : "";

/** Regions served (shown on service pages, emitted as areaServed). */
export const AREAS_SERVED = [
  { fr: "Genève", en: "Geneva", type: "AdministrativeArea" },
  { fr: "Vaud", en: "Vaud", type: "AdministrativeArea" },
  { fr: "Valais", en: "Valais", type: "AdministrativeArea" },
  { fr: "Berne (Gstaad)", en: "Bern (Gstaad)", type: "AdministrativeArea" },
  { fr: "Grisons (St-Moritz)", en: "Graubünden (St. Moritz)", type: "AdministrativeArea" },
  { fr: "Haute-Savoie et Savoie", en: "Haute-Savoie and Savoie", type: "AdministrativeArea" },
] as const;
