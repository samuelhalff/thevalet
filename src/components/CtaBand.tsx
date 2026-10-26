import { t, type Locale } from "@/lib/i18n";
import { pagePath, requestPath } from "@/lib/paths";
import { plainTitle } from "@/lib/typography";
import Button from "./ui/Button";
import Container from "./ui/Container";

/** Full-bleed bordeaux request band (docs/DESIGN.md): statement left, the request action right. */
export default function CtaBand({
  locale,
  title,
  text,
  serviceKey,
  buttonLabel,
}: {
  locale: Locale;
  title?: string;
  text?: string;
  serviceKey?: string;
  buttonLabel?: string;
}) {
  return (
    <section className="band mt-16">
      <Container className="grid gap-10 py-20 sm:py-24 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end lg:gap-20">
        <div>
          <h2 className="t-1 max-w-2xl">{plainTitle(title ?? t(locale, "ctaBand.title"))}</h2>
          <p className="t-lead mt-6 max-w-xl text-muted">{text ?? t(locale, "ctaBand.text")}</p>
        </div>
        <div className="flex flex-col items-start gap-5">
          <Button href={requestPath(locale, serviceKey)} size="lg">
            {buttonLabel ?? t(locale, "common.ctaRequest")}
          </Button>
          <Button href={pagePath(locale, "contact")} variant="link">
            {t(locale, "common.ctaContact")}
          </Button>
          <p className="t-small max-w-sm text-muted">{t(locale, "common.availability")}</p>
        </div>
      </Container>
    </section>
  );
}
