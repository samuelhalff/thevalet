import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { plainTitle } from "@/lib/typography";
import Breadcrumbs, { type BreadcrumbItem } from "./Breadcrumbs";
import Container from "./ui/Container";

/** Page opening: breadcrumbs, one H1 (display face), a lead paragraph, strong left edge. */
export default function PageHeader({
  locale,
  title,
  intro,
  crumbs,
  children,
  aside,
}: {
  locale: Locale;
  title: string;
  intro?: string;
  crumbs: BreadcrumbItem[];
  children?: ReactNode;
  /** Optional right column (a photo plate), aligned with the 320px aside of service pages. */
  aside?: ReactNode;
}) {
  const main = (
    <>
      <h1 className="t-1 mt-10 max-w-4xl">{plainTitle(title)}</h1>
      {intro ? <p className="t-lead mt-6 max-w-2xl text-muted">{intro}</p> : null}
      {children}
    </>
  );
  return (
    <div className="pb-8 pt-10 sm:pt-14">
      <Container>
        <Breadcrumbs locale={locale} items={crumbs} />
        {aside ? (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end lg:gap-16">
            <div className="min-w-0">{main}</div>
            <div>{aside}</div>
          </div>
        ) : (
          main
        )}
      </Container>
    </div>
  );
}
