import { getPublishedEntries } from "@/lib/content";
import { pagesCopy } from "@/lib/copy";
import { t } from "@/lib/i18n";
import { AREAS_SERVED } from "@/lib/business";
import { absoluteUrl, localePath, pagePath } from "@/lib/paths";
import { stripLinks } from "@/components/RichText";

export const dynamic = "force-static";

/** llms.txt built from the site content (EN first, FR mirror listed below). */
export function GET() {
  const link = (path: string, title: string, desc?: string) => `- [${title}](${absoluteUrl(path)})${desc ? `: ${stripLinks(desc)}` : ""}`;
  const en = pagesCopy("en");
  const fr = pagesCopy("fr");

  const lines = [
    "# The Valet",
    "",
    `> ${en.home.metaDescription}`,
    "",
    `The Valet is a premium concierge service based in Geneva, Switzerland ("${t("fr", "meta.tagline")}" / "${t("en", "meta.tagline")}"). One point of contact for private chauffeur and airport transfers, Geneva–Alps transfers, private child transport, private concierge, residence management, chalets and residences, weddings and private events, the Glam Team (hair, makeup, styling), medical concierge, security and legal or real estate introductions.`,
    `Areas: ${AREAS_SERVED.map((a) => a.en).join(", ")}; other destinations on request.`,
    `Availability: ${t("en", "common.availability")}`,
    "Regulated services (chauffeur/VTC, child transport, security, medical, legal, real estate, private jets, yachts) are coordinated through independent, appropriately licensed partners; The Valet does not itself give medical or legal advice. No prices are published: each request receives a proposal.",
    `How to request: the request form (${absoluteUrl(pagePath("en", "request"))}, French: ${absoluteUrl(pagePath("fr", "request"))}) or the contact page. Languages: French (default, /fr/) and English (/en/).`,
    "",
    "## Main pages (English)",
    link(localePath("en", "/"), "Home", en.home.metaDescription),
    link(pagePath("en", "services"), en.servicesHub.metaTitle, en.servicesHub.metaDescription),
    link(pagePath("en", "about"), en.about.metaTitle, en.about.metaDescription),
    link(pagePath("en", "faq"), en.faq.metaTitle, en.faq.metaDescription),
    link(pagePath("en", "request"), en.request.metaTitle, en.request.metaDescription),
    link(pagePath("en", "contact"), en.contact.metaTitle, en.contact.metaDescription),
    "",
    "## Services (English)",
    ...getPublishedEntries("en", "services").map((e) => link(localePath("en", `/services/${e.slug}/`), e.title, e.answer || e.description)),
    "",
    "## Services (français)",
    ...getPublishedEntries("fr", "services").map((e) => link(localePath("fr", `/services/${e.slug}/`), e.title, e.description)),
    "",
    "## Pages principales (français)",
    link(localePath("fr", "/"), "Accueil", fr.home.metaDescription),
    link(pagePath("fr", "services"), fr.servicesHub.metaTitle),
    link(pagePath("fr", "about"), fr.about.metaTitle),
    link(pagePath("fr", "faq"), fr.faq.metaTitle),
    link(pagePath("fr", "request"), fr.request.metaTitle),
    link(pagePath("fr", "contact"), fr.contact.metaTitle),
  ];

  const journal = [...getPublishedEntries("en", "journal"), ...getPublishedEntries("fr", "journal")];
  if (journal.length) {
    lines.push("", "## Journal");
    for (const e of journal) lines.push(link(localePath(e.locale, `/journal/${e.slug}/`), e.title, e.description));
  }

  lines.push(
    "",
    "## Optional",
    link(pagePath("en", "privacy"), t("en", "nav.privacy")),
    link(pagePath("en", "legal"), t("en", "nav.legal")),
    link(pagePath("en", "terms"), t("en", "nav.terms")),
    "",
  );

  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
