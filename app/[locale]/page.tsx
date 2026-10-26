import type { Metadata } from "next";
import { getPublishedEntries } from "@/lib/content";
import { pagesCopy } from "@/lib/copy";
import { t } from "@/lib/i18n";
import { pagePath } from "@/lib/paths";
import { fixedPageMetadata, getLocale, type LocaleParams } from "@/lib/page";
import { serviceItinerary } from "@/lib/itinerary";
import { plainTitle } from "@/lib/typography";
import Faq from "@/components/Faq";
import CtaBand from "@/components/CtaBand";
import RichText from "@/components/RichText";
import HeroCheck from "@/components/HeroCheck";
import Itinerary from "@/components/Itinerary";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import Timeline from "@/components/ui/Timeline";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await getLocale(params);
  const c = pagesCopy(locale).home;
  return fixedPageMetadata(locale, "home", c.metaTitle, c.metaDescription, { absoluteTitle: true });
}

export default async function HomePage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  const c = pagesCopy(locale).home;
  const services = getPublishedEntries(locale, "services");

  return (
    <>
      {/* Hero: strong left edge, the keyword H1 set large, the tagline as a whole italic phrase,
          and the V drawing itself once on the right. */}
      <section>
        <Container className="grid gap-10 pb-16 pt-14 sm:pb-24 sm:pt-20 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <h1 className="t-hero max-w-[14ch]">{c.hero.h1}</h1>
            <p className="phrase t-2 mt-6 text-brand">{plainTitle(c.hero.headline)}</p>
            <p className="t-lead mt-8 max-w-xl text-muted">{c.hero.lead}</p>
            <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8">
              <Button href={pagePath(locale, "request")} size="lg">
                {t(locale, "common.ctaRequest")}
              </Button>
              <Button href={pagePath(locale, "services")} variant="link">
                {t(locale, "common.allServices")}
              </Button>
            </div>
            <p className="t-small mt-8 max-w-md text-muted">{t(locale, "common.availability")}</p>
          </div>
          <HeroCheck className="mx-auto hidden w-full max-w-[18rem] lg:block" />
        </Container>
      </section>

      {/* Airy statement */}
      <Section spacing="md">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-24">
          <SectionHeading title={c.intro.title} />
          <div className="max-w-prose space-y-5 text-[1.0625rem]">
            {c.intro.paragraphs.map((p) => (
              <RichText key={p} text={p} />
            ))}
          </div>
        </div>
      </Section>

      {/* Dense practical: the itinerary of services */}
      <Section spacing="md">
        <SectionHeading title={c.services.title} />
        <RichText text={c.services.lead} className="mt-5 max-w-2xl text-muted" />
        <div className="mt-12">
          <Itinerary items={serviceItinerary(locale, services)} />
        </div>
      </Section>

      <Section spacing="md">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-24">
          <SectionHeading title={c.values.title} />
          <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {c.values.items.map((item) => (
              <div key={item.title}>
                <dt className="t-3">{item.title}</dt>
                <dd className="mt-2 text-muted">
                  <RichText as="span" text={item.text} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section spacing="md" className="bg-subtle">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-24">
          <SectionHeading title={c.steps.title} lead={c.steps.lead} />
          <Timeline items={c.steps.items} />
        </div>
      </Section>

      {/* Dense: where we work */}
      <Section spacing="md">
        <SectionHeading title={c.destinations.title} lead={c.destinations.lead} />
        <dl className="mt-12 grid gap-x-12 gap-y-9 sm:grid-cols-2">
          {c.destinations.items.map((d) => (
            <div key={d.name} className="grid gap-1 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6">
              <dt className="font-display text-[1.45rem] leading-tight">{d.name}</dt>
              <dd className="text-[0.98rem] text-muted">
                <RichText as="span" text={d.text} />
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section spacing="md" container="narrow">
        <SectionHeading title={c.partners.title} size="md" />
        <div className="mt-6 space-y-5">
          {c.partners.paragraphs.map((p) => (
            <RichText key={p} text={p} />
          ))}
        </div>
      </Section>

      <Section spacing="md" container="narrow">
        <Faq title={c.faq.title} items={c.faq.items} />
      </Section>

      <CtaBand locale={locale} title={c.closing.title} text={c.closing.text} />
    </>
  );
}
