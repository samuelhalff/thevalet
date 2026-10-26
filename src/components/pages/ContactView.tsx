import { pagesCopy } from "@/lib/copy";
import { getMessages, t, type Locale } from "@/lib/i18n";
import { pagePath, pageSlug } from "@/lib/paths";
import { FORMSPARK_ID, whatsappUrl } from "@/lib/site";
import { emailHref, phoneHref } from "@/lib/business";
import PageHeader from "../PageHeader";
import ContactForm from "../ContactForm";
import ContactChannels from "../ContactChannels";
import Button from "../ui/Button";
import Section from "../ui/Section";
import { channelOptions } from "./RequestView";

export default function ContactView({ locale }: { locale: Locale }) {
  const c = pagesCopy(locale).contact;
  const m = getMessages(locale);
  const hasChannels = Boolean(whatsappUrl || phoneHref || emailHref);
  return (
    <>
      <PageHeader locale={locale} title={c.title} intro={c.intro} crumbs={[{ label: t(locale, "nav.contact"), path: pageSlug(locale, "contact") }]} />
      <Section spacing="sm" className="pb-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14">
          <div id="form" className="scroll-mt-28">
            <ContactForm
              labels={m.contactForm}
              channels={channelOptions(locale)}
              locale={locale}
              formsparkId={FORMSPARK_ID}
              whatsappHref={whatsappUrl}
              privacyHref={pagePath(locale, "privacy")}
            />
          </div>
          <aside className="space-y-10">
            <div className="border-t border-ink pt-6">
              <p className="text-[0.98rem]">{c.availability}</p>
              <p className="mt-4 text-sm text-muted">{c.privacyNote}</p>
              <Button href={pagePath(locale, "request")} className="mt-6">
                {t(locale, "common.ctaRequest")}
              </Button>
            </div>
            {hasChannels ? (
              <div className="border-t border-line pt-6">
                <h2 className="text-[1.6rem]">{t(locale, "channels.title")}</h2>
                <div className="mt-5">
                  <ContactChannels locale={locale} />
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </Section>
    </>
  );
}
