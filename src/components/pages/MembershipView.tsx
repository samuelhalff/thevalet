import Link from "next/link";
import { pagesCopy } from "@/lib/copy";
import { t, type Locale } from "@/lib/i18n";
import { pagePath, pageSlug } from "@/lib/paths";
import PageHeader from "../PageHeader";
import Button from "../ui/Button";
import Section from "../ui/Section";

export default function MembershipView({ locale }: { locale: Locale }) {
  const c = pagesCopy(locale).membership;
  return (
    <>
      <PageHeader locale={locale} title={c.title} intro={c.intro} crumbs={[{ label: t(locale, "nav.membership"), path: pageSlug(locale, "membership") }]}>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{c.cardValidity}</p>
      </PageHeader>
      <Section spacing="sm" className="pb-24">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          {c.offers.map((offer) => (
            <article key={offer.title} className="flex min-w-0 flex-col rounded-panel border border-line bg-surface px-6 py-10 sm:px-10">
              <h2 className="text-center text-[2rem] text-brand">{offer.title}</h2>
              <p className="mt-6 border-y border-line py-6 text-lg leading-relaxed">{offer.description}</p>
              <ul className="space-y-5 py-8">
                {offer.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span aria-hidden="true" className="text-brand">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto border-t border-line pt-6 text-center">
                <p className="phrase text-center text-xl font-semibold">{offer.price}</p>
                <Button href={pagePath(locale, "contact")} className="mt-6">{offer.cta}</Button>
                <Link href={pagePath(locale, "contact")} className="mx-auto mt-3 flex min-h-11 w-fit items-center text-brand underline underline-offset-4 hover:decoration-2">
                  {c.learnMore} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
