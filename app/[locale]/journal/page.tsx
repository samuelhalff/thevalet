import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedEntries } from "@/lib/content";
import { pagesCopy } from "@/lib/copy";
import { localePath, pageSlug } from "@/lib/paths";
import { fixedPageMetadata, getLocale, type LocaleParams } from "@/lib/page";
import { t } from "@/lib/i18n";
import PageHeader from "@/components/PageHeader";
import CtaBand from "@/components/CtaBand";
import RichText from "@/components/RichText";
import { formatDate } from "@/components/JournalArticle";
import Section from "@/components/ui/Section";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await getLocale(params);
  const c = pagesCopy(locale).journal;
  // No articles yet: keep the index out of search results until the first one is published.
  const empty = getPublishedEntries(locale, "journal").length === 0;
  return fixedPageMetadata(locale, "journal", c.metaTitle, c.metaDescription, { noindex: empty });
}

export default async function JournalPage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  const c = pagesCopy(locale).journal;
  const articles = getPublishedEntries(locale, "journal");
  return (
    <>
      <PageHeader locale={locale} title={c.title} intro={c.intro} crumbs={[{ label: t(locale, "nav.journal"), path: pageSlug(locale, "journal") }]} />
      <Section spacing="sm" container="narrow">
        <div className="space-y-5 text-lg leading-relaxed">
          {c.paragraphs.map((p) => (
            <RichText key={p} text={p} />
          ))}
        </div>
        {articles.length ? (
          <ul className="mt-14 border-t border-line">
            {articles.map((a) => (
              <li key={a.slug} className="border-b border-line py-7">
                <Link href={localePath(locale, `/journal/${a.slug}/`)} className="group block">
                  <h2 className="text-[1.7rem] leading-snug transition-colors group-hover:text-accent">{a.title}</h2>
                  <p className="mt-2 text-muted">{a.description}</p>
                  <p className="mt-2 text-sm text-muted">{formatDate(a.published || a.updated, locale)}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-12 border-l-2 border-accent pl-4 text-muted">{c.empty}</p>
        )}
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
