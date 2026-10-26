import type { Entry } from "@/lib/content";
import { getByKey, getPublishedEntries } from "@/lib/content";
import { t, type Locale } from "@/lib/i18n";
import { absoluteUrl, localePath, pageSlug } from "@/lib/paths";
import { entryPath } from "@/lib/entry-route";
import { articleLd } from "@/lib/jsonld";
import PageHeader from "./PageHeader";
import Markdown from "./Markdown";
import Faq from "./Faq";
import JsonLd from "./JsonLd";
import CtaBand from "./CtaBand";
import Container from "./ui/Container";
import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";
import Itinerary from "./Itinerary";
import { serviceItinerary } from "@/lib/itinerary";

export function formatDate(iso: string, locale: Locale): string {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(locale === "en" ? "en-GB" : "fr-CH", { year: "numeric", month: "long", day: "numeric" });
}

/** Services an article relates to: its `service` key first, then every service page it links to (max 3). */
function relatedServices(locale: Locale, entry: Entry): Entry[] {
  const all = getPublishedEntries(locale, "services");
  const out: Entry[] = [];
  const main = entry.service ? getByKey(locale, "services", entry.service) : undefined;
  if (main) out.push(main);
  for (const s of all) if (!out.includes(s) && entry.body.includes(`/services/${s.slug}/`)) out.push(s);
  return out.slice(0, 3);
}

/** Journal article template: header with date, markdown body, FAQ, related services block, CTA. */
export default function JournalArticle({ locale, entry }: { locale: Locale; entry: Entry }) {
  const url = absoluteUrl(localePath(locale, entryPath("journal", entry.slug)));
  const related = relatedServices(locale, entry);
  const date = entry.published || entry.updated;
  return (
    <article>
      <PageHeader
        locale={locale}
        title={entry.title}
        intro={entry.description}
        crumbs={[
          { label: t(locale, "nav.journal"), path: pageSlug(locale, "journal") },
          { label: entry.title, path: entryPath("journal", entry.slug) },
        ]}
      >
        {date ? (
          <p className="mt-6 text-sm text-muted">
            {t(locale, "common.published")} <time dateTime={date}>{formatDate(date, locale)}</time>
          </p>
        ) : null}
      </PageHeader>
      <Container size="prose" className="pb-20 pt-8">
        <Markdown source={entry.body} />
        {entry.faq.length ? (
          <div className="mt-16 max-w-prose">
            <Faq title={t(locale, "common.faqTitle")} items={entry.faq} compact />
          </div>
        ) : null}
      </Container>
      {related.length ? (
        <Section hairline spacing="md">
          <SectionHeading title={t(locale, "journalPage.relatedServices")} size="md" />
          <div className="mt-10">
            <Itinerary size="md" items={serviceItinerary(locale, related)} />
          </div>
        </Section>
      ) : null}
      <CtaBand locale={locale} serviceKey={entry.service || undefined} />
      <JsonLd data={articleLd(entry, url)} />
    </article>
  );
}
