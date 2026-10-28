import Link from "next/link";
import settings from "../../content/settings.json";
import { getMessages, locales, t, type Locale } from "@/lib/i18n";
import { localePath, pagePath } from "@/lib/paths";
import { mainLinks, menuServices } from "@/lib/nav";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";
import ServicesMenu from "./ServicesMenu";
import NavLink from "./NavLink";
import Button from "./ui/Button";
import Container from "./ui/Container";

/** Sticky header: logo, services dropdown, main links, language, one primary action. */
export default function Header({ locale }: { locale: Locale }) {
  const instagram = settings.socialProfiles.find((url) => /^https:\/\/(www\.)?instagram\.com\//i.test(url));
  const services = menuServices(locale);
  const links = mainLinks(locale);
  const servicesHub = pagePath(locale, "services");
  const request = { href: pagePath(locale, "request"), label: t(locale, "common.ctaRequest") };
  const languages = locales.map((code) => ({ code, name: getMessages(locale).languages[code] }));

  return (
    <header className="site-header sticky top-0 z-40 text-ink">
      <Container className="flex h-[72px] items-center justify-between gap-4">
        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          {instagram && (
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-soft hover:bg-subtle" aria-label={locale === "fr" ? "Instagram The Valet (nouvel onglet)" : "The Valet Instagram (new tab)"}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
          )}
          <Link href={localePath(locale)} className="flex h-10 shrink-0 items-center rounded-soft" aria-label={`The Valet — ${t(locale, "common.home")}`}>
            <Logo decorative className="h-[30px] w-[116px] lg:h-9 lg:w-[139px]" />
          </Link>
        </div>
        <nav aria-label={t(locale, "common.mainNav")} className="hidden lg:block">
          <ul className="flex items-center gap-8 whitespace-nowrap text-[0.98rem]">
            <li>
              <ServicesMenu label={t(locale, "nav.services")} allLabel={t(locale, "common.allServices")} allHref={servicesHub} links={services} />
            </li>
            {links.map((l) => (
              <li key={l.href}>
                <NavLink href={l.href}>{l.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:block">
            <LanguageSwitcher current={locale} label={t(locale, "common.language")} languages={languages} />
          </div>
          <Button href={request.href} size="sm" className="hidden lg:inline-flex">
            {request.label}
          </Button>
          <MobileMenu
            services={services}
            servicesLabel={t(locale, "nav.services")}
            allServices={{ href: servicesHub, label: t(locale, "common.allServices") }}
            links={[...links, { href: pagePath(locale, "journal"), label: t(locale, "nav.journal") }]}
            cta={request}
            openLabel={t(locale, "common.menuOpen")}
            closeLabel={t(locale, "common.menuClose")}
            navLabel={t(locale, "common.mainNav")}
            languageLabel={t(locale, "common.language")}
            languages={languages}
            current={locale}
          />
        </div>
      </Container>
    </header>
  );
}
