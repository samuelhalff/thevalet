import { getPublishedEntries } from "@/lib/content";
import { pagesCopy } from "@/lib/copy";
import { getMessages, t, type Locale } from "@/lib/i18n";
import { pagePath, pageSlug } from "@/lib/paths";
import { shortServiceLabel } from "@/lib/nav";
import { FORMSPARK_ID, whatsappUrl } from "@/lib/site";
import PageHeader from "../PageHeader";
import RequestBuilder from "../RequestBuilder";
import ContactChannels from "../ContactChannels";
import Section from "../ui/Section";

export function channelOptions(locale: Locale) {
  const m = getMessages(locale).channelOptions;
  return [...(whatsappUrl ? [{ value: "whatsapp", label: m.whatsapp }] : []), { value: "phone", label: m.phone }, { value: "email", label: m.email }];
}

export default function RequestView({ locale }: { locale: Locale }) {
  const c = pagesCopy(locale).request;
  const m = getMessages(locale);
  const services = getPublishedEntries(locale, "services").map((s) => ({ value: s.translationKey, label: shortServiceLabel(locale, s.translationKey, s.title) }));
  return (
    <>
      <PageHeader locale={locale} title={c.title} intro={c.intro} crumbs={[{ label: t(locale, "nav.request"), path: pageSlug(locale, "request") }]} />
      <Section spacing="sm" className="pb-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14">
          <RequestBuilder
            labels={m.contactForm}
            r={m.request}
            services={services}
            channels={channelOptions(locale)}
            locale={locale}
            formsparkId={FORMSPARK_ID}
            whatsappHref={whatsappUrl}
            privacyHref={pagePath(locale, "privacy")}
          />
          <aside className="space-y-6 text-[0.95rem] text-muted">
            <p className="border-t border-ink pt-6 text-ink">{t(locale, "common.availability")}</p>
            <p>{m.contactForm.sensitiveNote}</p>
            <ContactChannels locale={locale} />
          </aside>
        </div>
      </Section>
    </>
  );
}
