import Link from "next/link";
import { getByKey } from "@/lib/content";
import { t, type Locale } from "@/lib/i18n";
import { localePath, pagePath } from "@/lib/paths";
import { menuServices } from "@/lib/nav";
import { GA_ID } from "@/lib/site";
import { business } from "@/lib/business";
import Logo from "./Logo";
import CookieSettingsButton from "./CookieSettingsButton";
import ContactChannels from "./ContactChannels";
import Container from "./ui/Container";

type FooterLink = { href: string; label: string };

function Column({ title, items, children }: { title: string; items: FooterLink[]; children?: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-[1.2rem]">{title}</h2>
      <ul className="mt-4 space-y-2">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="text-[0.95rem] underline-offset-4 hover:underline">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}

/** Footer: every service, the two Alpine pillar pages, the house pages and the legal pages. */
export default function Footer({ locale }: { locale: Locale }) {
  const year = new Date().getFullYear();
  const services = menuServices(locale);
  const pillars: FooterLink[] = [];
  for (const key of ["chalets", "alpine-transfers"]) {
    const e = getByKey(locale, "services", key);
    if (e) pillars.push({ href: localePath(locale, `/services/${e.slug}/`), label: e.title });
  }
  const house: FooterLink[] = [
    { href: pagePath(locale, "services"), label: t(locale, "common.allServices") },
    { href: pagePath(locale, "about"), label: t(locale, "nav.about") },
    { href: pagePath(locale, "faq"), label: t(locale, "nav.faq") },
    { href: pagePath(locale, "journal"), label: t(locale, "nav.journal") },
    { href: pagePath(locale, "contact"), label: t(locale, "nav.contact") },
    { href: pagePath(locale, "request"), label: t(locale, "nav.request") },
  ];
  const legal: FooterLink[] = [
    { href: pagePath(locale, "privacy"), label: t(locale, "nav.privacy") },
    { href: pagePath(locale, "legal"), label: t(locale, "nav.legal") },
    { href: pagePath(locale, "terms"), label: t(locale, "nav.terms") },
  ];

  return (
    <footer className="band relative mt-auto">
      <Container>
        <div className="h-px bg-line" />
      </Container>
      <Container className="grid gap-x-12 gap-y-12 pb-14 pt-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.1fr_1fr]">
        <div>
          <Logo className="h-10 w-[79px]" />
          <p className="mt-5 max-w-sm text-[0.95rem] text-muted">{t(locale, "footer.blurb")}</p>
          <p className="mt-4 max-w-sm text-sm text-muted">{t(locale, "common.availability")}</p>
          <div className="mt-5">
            <ContactChannels locale={locale} compact />
          </div>
        </div>
        <Column title={t(locale, "footer.services")} items={services} />
        <Column title={t(locale, "footer.alps")} items={pillars}>
          <h2 className="mt-10 font-display text-[1.2rem]">{t(locale, "footer.house")}</h2>
          <ul className="mt-4 space-y-2">
            {house.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-[0.95rem] underline-offset-4 hover:underline">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mt-10 font-display text-[1.2rem]">{t(locale, "footer.legal")}</h2>
          <ul className="mt-4 space-y-2">
            {legal.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-[0.95rem] underline-offset-4 hover:underline">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
          {GA_ID ? (
            <div className="mt-2">
              <CookieSettingsButton label={t(locale, "footer.cookieSettings")} />
            </div>
          ) : null}
        </Column>
      </Container>
      <Container>
        <div className="flex flex-col gap-2 border-t border-line py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{t(locale, "meta.tagline")}</p>
          <p>
            © {year} {business.legalName || "The Valet"}. {t(locale, "footer.rights")}
          </p>
        </div>
      </Container>
    </footer>
  );
}
