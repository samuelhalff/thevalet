import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import "../globals.css";
import { display, text } from "@/lib/fonts";
import { htmlLang, isLocale, locales, t } from "@/lib/i18n";
import { pagePath } from "@/lib/paths";
import { GA_ID, NOINDEX, SITE_NAME, SITE_URL, whatsappUrl } from "@/lib/site";
import { organizationLd, websiteLd } from "@/lib/jsonld";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import AnalyticsBootstrap from "@/components/Analytics";
import CookieBanner from "@/components/CookieBanner";
import StickyCta from "@/components/StickyCta";
import WhatsAppButton from "@/components/WhatsAppButton";
import AttributionCapture from "@/components/AttributionCapture";
import { THEME_COLORS, themeInitScript } from "@/lib/theme";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  robots: NOINDEX ? { index: false, follow: false } : undefined,
  formatDetection: { telephone: false },
  openGraph: { images: [{ url: "/og.png", width: 1200, height: 630, alt: SITE_NAME }] },
};

export const viewport: Viewport = {
  // The owner chose one white, light appearance on every device.
  themeColor: THEME_COLORS.light,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html data-theme="light" lang={htmlLang[locale]} className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <head>
        {/* Clears legacy theme choices before first paint. */}
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <AnalyticsBootstrap />
        <JsonLd data={[organizationLd(locale), websiteLd(locale)]} />
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only z-50 bg-ink px-5 py-2.5 text-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {t(locale, "common.skipToContent")}
        </a>
        <Header locale={locale} />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer locale={locale} />
        <StickyCta
          href={pagePath(locale, "request")}
          label={t(locale, "stickyCta.label")}
          hideOn={[pagePath(locale, "request"), pagePath(locale, "contact")]}
        />
        <WhatsAppButton href={whatsappUrl} label={t(locale, "channels.whatsappCta")} />
        <AttributionCapture />
        {GA_ID ? (
          <CookieBanner
            text={t(locale, "cookies.text")}
            accept={t(locale, "cookies.accept")}
            decline={t(locale, "cookies.decline")}
            more={t(locale, "cookies.more")}
            label={t(locale, "cookies.label")}
            privacyHref={pagePath(locale, "privacy")}
          />
        ) : null}
      </body>
    </html>
  );
}
