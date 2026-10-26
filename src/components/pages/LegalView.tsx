import { legalCopy } from "@/lib/copy";
import { t, type Locale } from "@/lib/i18n";
import { business, emailHref, hasAddress, phoneHref } from "@/lib/business";
import { pageSlug } from "@/lib/paths";
import { GA_ID } from "@/lib/site";
import PageHeader from "../PageHeader";
import LegalText from "../LegalText";
import RichText from "../RichText";
import CookieSettingsButton from "../CookieSettingsButton";
import Section from "../ui/Section";
import Panel from "../ui/Panel";

/** Bump when the legal texts change. */
const UPDATED = "2026-10-26";

/** Operator identity from config; each line renders only when configured. */
function Identity({ locale }: { locale: Locale }) {
  const rows = [
    { label: t(locale, "legalIdentity.name"), value: business.legalName },
    { label: t(locale, "legalIdentity.address"), value: hasAddress ? [business.street, [business.postalCode, business.city].filter(Boolean).join(" "), business.country].filter(Boolean).join(", ") : "" },
    { label: t(locale, "legalIdentity.uid"), value: business.uid },
    { label: t(locale, "legalIdentity.responsible"), value: business.responsible },
    { label: t(locale, "legalIdentity.hosting"), value: business.hosting },
  ].filter((r) => r.value);
  const links = [
    phoneHref ? { label: t(locale, "legalIdentity.phone"), href: phoneHref, value: business.phone } : null,
    emailHref ? { label: t(locale, "legalIdentity.email"), href: emailHref, value: business.email } : null,
  ].filter(Boolean) as { label: string; href: string; value: string }[];
  return (
    <Panel as="section" aria-labelledby="identity-title" className="mb-12">
      <h2 id="identity-title" className="text-[1.5rem]">
        {t(locale, "legalIdentity.title")}
      </h2>
      {rows.length || links.length ? (
        <dl className="mt-4 grid gap-x-6 gap-y-3 text-[0.95rem] sm:grid-cols-[12rem_1fr]">
          <dt className="text-muted">The Valet</dt>
          <dd>{t(locale, "meta.tagline")}</dd>
          {rows.map((r) => (
            <div key={r.label} className="contents">
              <dt className="text-muted">{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
          {links.map((l) => (
            <div key={l.label} className="contents">
              <dt className="text-muted">{l.label}</dt>
              <dd>
                <a href={l.href} className="link">
                  {l.value}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-[0.95rem] text-muted">{t(locale, "legalIdentity.pending")}</p>
      )}
    </Panel>
  );
}

export default function LegalView({ locale, doc, label }: { locale: Locale; doc: "privacy" | "legal" | "terms"; label: string }) {
  const d = legalCopy(locale)[doc];
  return (
    <>
      <PageHeader locale={locale} title={d.title} crumbs={[{ label, path: pageSlug(locale, doc) }]}>
        {d.intro ? <RichText text={d.intro} className="mt-5 max-w-2xl text-lg text-muted" /> : null}
        <p className="mt-4 text-sm text-muted">
          {t(locale, "legalPage.updatedLabel")}: <time dateTime={UPDATED}>{UPDATED}</time>
        </p>
      </PageHeader>
      <Section spacing="sm" container="narrow" className="pb-24">
        <Identity locale={locale} />
        <LegalText sections={d.sections} />
        {doc === "privacy" && GA_ID ? (
          <div className="mt-8">
            <CookieSettingsButton variant="button" label={t(locale, "footer.cookieSettings")} />
          </div>
        ) : null}
      </Section>
    </>
  );
}
