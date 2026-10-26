import type { Metadata } from "next";
import "./globals.css";
import { display, text } from "@/lib/fonts";
import { getMessages, locales } from "@/lib/i18n";
import { themeInitScript } from "@/lib/theme";
import Logo from "@/components/Logo";
import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import Container from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "404 | The Valet",
  robots: { index: false, follow: true },
};

/** Served as /404.html (ErrorDocument). One page, both languages. */
export default function GlobalNotFound() {
  return (
    <html lang="fr" className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-line">
          <Container className="flex h-[72px] items-center">
            <a href="/fr/" aria-label="The Valet" className="rounded-soft">
              <Logo decorative className="h-9 w-[71px]" />
            </a>
          </Container>
        </header>
        <main id="main" className="flex-1 py-16">
          <Container>
            <p className="font-display text-[1.4rem] italic text-brand">404</p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {locales.map((loc) => {
                const m = getMessages(loc).notFound;
                const Heading = loc === "fr" ? "h1" : "h2";
                return (
                  <Panel key={loc} as="section" padding="lg">
                    <div lang={loc}>
                      <Heading className="text-3xl">{m.title}</Heading>
                      <p className="mt-3 text-muted">{m.text}</p>
                      <Button href={`/${loc}/`} native className="mt-6">
                        {m.home}
                      </Button>
                    </div>
                  </Panel>
                );
              })}
            </div>
          </Container>
        </main>
      </body>
    </html>
  );
}
