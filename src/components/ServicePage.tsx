import Link from "next/link";
import type { Entry } from "@/lib/content";
import { getPublishedEntries } from "@/lib/content";
import { t, type Locale } from "@/lib/i18n";
import { AREAS_SERVED } from "@/lib/business";
import { absoluteUrl, localePath, pagePath, pageSlug, requestPath } from "@/lib/paths";
import { entryPath } from "@/lib/entry-route";
import { serviceLd } from "@/lib/jsonld";
import { shortServiceLabel } from "@/lib/nav";
import PageHeader from "./PageHeader";
import Markdown from "./Markdown";
import Faq from "./Faq";
import JsonLd from "./JsonLd";
import CtaBand from "./CtaBand";
import Button from "./ui/Button";
import Container from "./ui/Container";
import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";
import Itinerary from "./Itinerary";
import Plate from "./Plate";
import { serviceImage } from "@/lib/images";
import { serviceItinerary } from "@/lib/itinerary";

/** Related services: the ones this page links to in its body first, then neighbours by order. */
function relatedServices(locale: Locale, entry: Entry, count = 3): Entry[] {
  const all = getPublishedEntries(locale, "services").filter((e) => e.slug !== entry.slug);
  const linked = all.filter((e) => entry.body.includes(`/services/${e.slug}/`));
  const rest = all
    .filter((e) => !linked.includes(e))
    .sort((a, b) => Math.abs(a.order - entry.order) - Math.abs(b.order - entry.order));
  return [...linked, ...rest].slice(0, count);
}

export default function ServicePage({ locale, entry }: { locale: Locale; entry: Entry }) {
  const url = absoluteUrl(localePath(locale, entryPath("services", entry.slug)));
  const related = relatedServices(locale, entry);
  const request = requestPath(locale, entry.translationKey);
  const photo = serviceImage(entry.translationKey);
  const facts = [
    { label: t(locale, "service.availabilityLabel"), value: t(locale, "common.availability") },
    { label: t(locale, "service.areaLabel"), value: AREAS_SERVED.map((a) => a[locale]).join(", ") },
    { label: t(locale, "service.languagesLabel"), value: t(locale, "service.languagesText") },
    {
      label: t(locale, "service.deliveryLabel"),
      value: entry.delivery === "partner" ? t(locale, "service.deliveryPartner") : t(locale, "service.deliveryCoordinated"),
    },
  ];

  return (
    <article data-service-key={entry.translationKey}>
      <PageHeader
        locale={locale}
        title={entry.title}
        crumbs={[
          { label: t(locale, "nav.services"), path: pageSlug(locale, "services") },
          { label: shortServiceLabel(locale, entry.translationKey, entry.title), path: entryPath("services", entry.slug) },
        ]}
        aside={photo ? <Plate name={photo} locale={locale} variant="portrait" priority /> : undefined}
      >
        {entry.answer ? <p className="t-lead mt-6 max-w-3xl">{entry.answer}</p> : null}
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Button href={request} size="lg">
            {t(locale, "service.cta")}
          </Button>
        </div>
      </PageHeader>

      <Container className="grid gap-14 pb-20 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
        <div className="min-w-0">
          {entry.draft ? (
            <p className="mb-8 border-l-2 border-accent pl-4 text-sm">
              <strong className="mr-2 font-semibold">{t(locale, "common.draftBadge")}.</strong>
              {t(locale, "common.draftNotice")}
            </p>
          ) : null}
          <Markdown source={entry.body} />
          {entry.faq.length ? (
            <div className="mt-16 max-w-prose">
              <Faq title={t(locale, "common.faqTitle")} items={entry.faq} compact />
            </div>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border-t border-ink pt-6">
            <h2 className="text-[1.6rem] leading-snug">{t(locale, "service.factsTitle")}</h2>
            <dl className="mt-4 space-y-4 text-[0.95rem]">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="t-small font-medium text-muted">{f.label}</dt>
                  <dd className="mt-1">{f.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-muted">{t(locale, "service.areasNote")}</p>
            <h2 className="mt-10 text-[1.4rem] leading-snug">{t(locale, "service.asideTitle")}</h2>
            <p className="mt-3 text-[0.95rem] text-muted">{t(locale, "service.asideText")}</p>
            <Button href={request} className="mt-6">
              {t(locale, "service.cta")}
            </Button>
            <div className="mt-5">
              <Link href={pagePath(locale, "contact")} className="link text-[0.95rem]">
                {t(locale, "common.ctaContact")}
              </Link>
            </div>
          </div>
        </aside>
      </Container>

      {related.length ? (
        <Section hairline spacing="md">
          <SectionHeading title={t(locale, "service.relatedTitle")} size="md" />
          <div className="mt-10">
            <Itinerary size="md" items={serviceItinerary(locale, related)} />
          </div>
        </Section>
      ) : null}

      <CtaBand locale={locale} serviceKey={entry.translationKey} buttonLabel={t(locale, "service.cta")} />
      <JsonLd data={serviceLd(entry, url)} />
    </article>
  );
}
