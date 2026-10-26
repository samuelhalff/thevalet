import { pagesCopy } from "@/lib/copy";
import { t, type Locale } from "@/lib/i18n";
import { pageSlug } from "@/lib/paths";
import { faqLd } from "@/lib/jsonld";
import PageHeader from "../PageHeader";
import CtaBand from "../CtaBand";
import Faq from "../Faq";
import JsonLd from "../JsonLd";
import { stripLinks } from "../RichText";
import Section from "../ui/Section";
import { slugify } from "../../../scripts/lib/heading-id.mjs";

/** FAQ hub: grouped questions, one FAQPage JSON-LD for all of them. */
export default function FaqView({ locale }: { locale: Locale }) {
  const c = pagesCopy(locale).faq;
  const all = c.groups.flatMap((g) => g.items);
  return (
    <>
      <PageHeader locale={locale} title={c.title} intro={c.intro} crumbs={[{ label: t(locale, "nav.faq"), path: pageSlug(locale, "faq") }]} />
      <Section spacing="sm" container="narrow" className="pb-20">
        <nav aria-label={c.title} className="mb-14">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[0.95rem]">
            {c.groups.map((g) => (
              <li key={g.title}>
                <a href={`#${slugify(g.title)}`} className="link">
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-16">
          {c.groups.map((g) => (
            <div key={g.title} id={slugify(g.title)} className="scroll-mt-28">
              <Faq id={slugify(g.title)} title={g.title} items={g.items} schema={false} compact />
            </div>
          ))}
        </div>
      </Section>
      <JsonLd data={faqLd(all.map((f) => ({ q: f.q, a: stripLinks(f.a) })))} />
      <CtaBand locale={locale} />
    </>
  );
}
