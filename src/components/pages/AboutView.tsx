import { pagesCopy } from "@/lib/copy";
import { t, type Locale } from "@/lib/i18n";
import { pageSlug } from "@/lib/paths";
import PageHeader from "../PageHeader";
import CtaBand from "../CtaBand";
import RichText from "../RichText";
import Section from "../ui/Section";
import SectionHeading from "../ui/SectionHeading";

export default function AboutView({ locale }: { locale: Locale }) {
  const c = pagesCopy(locale).about;
  return (
    <>
      <PageHeader locale={locale} title={c.title} intro={c.intro} crumbs={[{ label: t(locale, "nav.about"), path: pageSlug(locale, "about") }]} />
      <Section spacing="sm" className="pb-20">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)] lg:gap-20">
          <div className="max-w-prose space-y-14">
            {c.sections.map((s) => (
              <section key={s.h}>
                <SectionHeading title={s.h} size="md" />
                <div className="mt-5 space-y-5 text-lg leading-relaxed">
                  {s.paragraphs.flatMap((p) => p.split("\n\n")).map((p) => (
                    <RichText key={p} text={p} />
                  ))}
                </div>
              </section>
            ))}
            <section>
              <SectionHeading title={c.commitments.title} size="md" />
              <ul className="mt-6 border-t border-line">
                {c.commitments.items.map((v) => (
                  <li key={v} className="border-b border-line py-4">
                    <RichText as="span" text={v} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
