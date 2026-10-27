import type { Metadata } from "next";
import { getByKey, getPublishedEntries } from "@/lib/content";
import { pagesCopy } from "@/lib/copy";
import { t } from "@/lib/i18n";
import { localePath, pagePath } from "@/lib/paths";
import type { Locale } from "@/lib/i18n";
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
import Link from "next/link";
import Plate from "@/components/Plate";
import type { ImageName } from "@/lib/images";

/** The three chapters of the home itinerary (translationKeys, in display order). */
const CHAPTERS: Record<string, string[]> = {
  move: ["chauffeur", "alpine-transfers", "child-transport"],
  stay: ["chalets", "residence-management", "events", "glam-team"],
  accompany: ["concierge", "medical", "security", "legal-real-estate"],
};

/** Desktop-only photo under one chapter intro; the other chapters stay text. */
const CHAPTER_PLATES: Record<string, ImageName> = { stay: "table" };

/** Resorts of the route index; ids match the H3 anchors on both pillar pages. */
const RESORTS = [
  ["Verbier", "verbier"],
  ["Zermatt", "zermatt"],
  ["Gstaad", "gstaad"],
  ["St-Moritz", "st-moritz"],
  ["Courchevel", "courchevel"],
  ["Megève", "megeve"],
  ["Chamonix", "chamonix"],
] as const;

function pillarPath(locale: Locale, key: string): string | undefined {
  const e = getByKey(locale, "services", key);
  return e ? localePath(locale, `/services/${e.slug}/`) : undefined;
}

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
    <div className="bold-page-headings">
      {/* Hero: strong left edge, the keyword H1 set large, the tagline as a whole italic phrase,
          and the V drawing itself once on the right. */}
      <section>
        <Container className="grid gap-10 pb-16 pt-14 sm:pb-24 sm:pt-20 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <h1 className="t-hero">
              <span className="flex items-center gap-1">
                <strong className="font-bold">{c.hero.h1.split("\n")[0].replace(" 🇨🇭", "")}</strong>
                <svg className="relative -top-2 h-5 w-5 shrink-0 sm:h-6 sm:w-6" viewBox="1173.40625 491.984375 75 75" aria-hidden="true" focusable="false">
                  <path className="logo-swiss-red" d="M 1173.40625 491.984375 L 1248.40625 491.984375 L 1248.40625 566.984375 L 1173.40625 566.984375 Z M 1173.40625 491.984375 " />
<path className="logo-swiss-white" d="M 1233.527344 522.578125 L 1217.8125 522.578125 L 1217.8125 506.863281 L 1204.003906 506.863281 L 1204.003906 522.578125 L 1188.289062 522.578125 L 1188.289062 536.390625 L 1204.003906 536.390625 L 1204.003906 552.101562 L 1217.8125 552.101562 L 1217.8125 536.390625 L 1233.527344 536.390625 Z M 1233.527344 522.578125 " />
                </svg>
              </span>
              <span className="t-2 mt-6 block max-w-[24ch] font-normal">{c.hero.h1.split("\n")[1]}</span>
            </h1>
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
          <div>
            <SectionHeading title={c.intro.title} />
            <Plate name="alps" locale={locale} className="mt-12 max-w-[20rem]" />
          </div>
          <div className="max-w-prose space-y-5 text-[1.0625rem]">
            {c.intro.paragraphs.flatMap((p) => p.split("\n\n")).map((p) => (
              <RichText key={p} text={p} />
            ))}
          </div>
        </div>
      </Section>

      {/* The services as three typographic chapters, each an itinerary */}
      <Section spacing="md">
        <SectionHeading title={c.services.title} />
        <RichText text={c.services.lead} className="mt-5 max-w-2xl text-muted" />
        <div className="mt-16 space-y-20">
          {c.chapters.map((ch) => {
            const items = (CHAPTERS[ch.key] ?? [])
              .map((k) => services.find((e) => e.translationKey === k))
              .filter((e): e is (typeof services)[number] => Boolean(e));
            return (
              <div key={ch.key} className="grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.6fr)] lg:gap-16">
                <div>
                  <h3 className="t-2">{ch.title}</h3>
                  <RichText text={ch.text} className="mt-4 max-w-sm text-muted" />
                  {CHAPTER_PLATES[ch.key] ? (
                    <Plate name={CHAPTER_PLATES[ch.key]} locale={locale} className="mt-10 hidden max-w-[17rem] lg:block" />
                  ) : null}
                </div>
                <Itinerary size="md" items={serviceItinerary(locale, items)} />
              </div>
            );
          })}
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

      {/* Compact route index: each resort → access (transfers) and stay (chalets) */}
      <Section spacing="md">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-24">
          <SectionHeading title={c.destinations.title} lead={c.destinations.lead} />
          <table className="w-full text-left">
            <caption className="sr-only">{t(locale, "routeIndex.title")}</caption>
            <thead className="t-small text-muted">
              <tr className="border-b border-line">
                <th scope="col" className="py-2 font-medium">
                  <span className="sr-only">{t(locale, "routeIndex.title")}</span>
                </th>
                <th scope="col" className="py-2 font-medium">{t(locale, "routeIndex.access")}</th>
                <th scope="col" className="py-2 font-medium">{t(locale, "routeIndex.stay")}</th>
              </tr>
            </thead>
            <tbody>
              {RESORTS.map(([name, id]) => {
                const transfers = pillarPath(locale, "alpine-transfers");
                const chalets = pillarPath(locale, "chalets");
                return (
                  <tr key={id} className="border-b border-line">
                    <th scope="row" className="py-3 pr-6 font-display text-[1.35rem] font-normal">
                      {name}
                    </th>
                    <td className="py-3 pr-4">
                      {transfers ? (
                        <Link href={`${transfers}#${id}`} className="link">
                          {locale === "fr" ? `Genève → ${name}` : `Geneva → ${name}`}
                        </Link>
                      ) : null}
                    </td>
                    <td className="py-3">
                      {chalets ? (
                        <Link href={`${chalets}#${id}`} className="link">
                          {locale === "fr" ? `Séjour à ${name}` : `Staying in ${name}`}
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Who does what: one full-width bordeaux statement */}
      <section className="band">
        <Container className="grid gap-10 py-20 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-24">
          <h2 className="t-1">{c.partners.title}</h2>
          <div className="t-lead space-y-5">
            {c.partners.paragraphs.map((p) => (
              <RichText key={p} text={p} />
            ))}
          </div>
        </Container>
      </section>

      <Section spacing="md" container="narrow">
        <Faq title={c.faq.title} items={c.faq.items} />
      </Section>

      <CtaBand locale={locale} title={c.closing.title} text={c.closing.text} />
    </div>
  );
}
