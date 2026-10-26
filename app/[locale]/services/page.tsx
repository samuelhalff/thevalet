import type { Metadata } from "next";
import { getPublishedEntries } from "@/lib/content";
import { pagesCopy } from "@/lib/copy";
import { pageSlug } from "@/lib/paths";
import { fixedPageMetadata, getLocale, type LocaleParams } from "@/lib/page";
import { t } from "@/lib/i18n";
import PageHeader from "@/components/PageHeader";
import CtaBand from "@/components/CtaBand";
import RichText from "@/components/RichText";
import Section from "@/components/ui/Section";
import Itinerary from "@/components/Itinerary";
import { serviceItinerary } from "@/lib/itinerary";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await getLocale(params);
  const c = pagesCopy(locale).servicesHub;
  return fixedPageMetadata(locale, "services", c.metaTitle, c.metaDescription);
}

export default async function ServicesPage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  const c = pagesCopy(locale).servicesHub;
  const services = getPublishedEntries(locale, "services");
  return (
    <>
      <PageHeader locale={locale} title={c.title} intro={c.intro} crumbs={[{ label: t(locale, "nav.services"), path: pageSlug(locale, "services") }]} />
      <Section spacing="sm">
        <Itinerary items={serviceItinerary(locale, services)} />
      </Section>
      <Section spacing="sm" container="narrow">
        <div className="space-y-5 text-lg leading-relaxed">
          {c.paragraphs.map((p) => (
            <RichText key={p} text={p} />
          ))}
        </div>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
