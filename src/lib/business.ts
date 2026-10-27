/**
 * Business details, all optional. They live in content/settings.json so the owner can change
 * them herself; a non-empty NEXT_PUBLIC_* env var overrides the file. While a value is empty the
 * site renders nothing for it (no placeholder text, no fake number) and JSON-LD omits it.
 */
import settings from "../../content/settings.json";

const env = (key: string, fallback = "") => ((process.env[key] || "").trim() || fallback.trim());

export const business = {
  /** Registered legal name, e.g. "The Valet Sàrl" (unknown yet). */
  legalName: env("NEXT_PUBLIC_COMPANY_NAME", settings.companyName),
  /** Commercial register UID, e.g. "CHE-123.456.789". */
  uid: env("NEXT_PUBLIC_COMPANY_UID", settings.uid),
  street: env("NEXT_PUBLIC_COMPANY_STREET", settings.street),
  postalCode: env("NEXT_PUBLIC_COMPANY_POSTCODE", settings.postalCode),
  city: env("NEXT_PUBLIC_COMPANY_CITY", settings.city),
  /** ISO country code; defaults to CH only when an address is given. */
  country: env("NEXT_PUBLIC_COMPANY_COUNTRY", settings.country) || "CH",
  /** Public phone in international format, e.g. "+41 22 000 00 00". */
  phone: env("NEXT_PUBLIC_CONTACT_PHONE", settings.phone),
  email: env("NEXT_PUBLIC_CONTACT_EMAIL", settings.email),
  /** Person or role responsible for the website content (legal notice). */
  responsible: env("NEXT_PUBLIC_COMPANY_RESPONSIBLE", settings.responsible),
  /** Hosting provider name and country for the privacy policy, e.g. "Infomaniak (Switzerland)". */
  hosting: env("NEXT_PUBLIC_HOSTING_PROVIDER", settings.hosting),
  /** Verified public profiles only (comma-separated URLs): Instagram, LinkedIn, Google Business Profile. */
  sameAs: env("NEXT_PUBLIC_SAME_AS", settings.socialProfiles.join(","))
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
