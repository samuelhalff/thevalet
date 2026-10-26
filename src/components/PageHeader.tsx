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
}: {
  locale: Locale;
  title: string;
  intro?: string;
  crumbs: BreadcrumbItem[];
  children?: ReactNode;
}) {
  return (
    <div className="pb-8 pt-10 sm:pt-14">
      <Container>
        <Breadcrumbs locale={locale} items={crumbs} />
        <h1 className="t-1 mt-10 max-w-4xl">{plainTitle(title)}</h1>
        {intro ? <p className="t-lead mt-6 max-w-2xl text-muted">{intro}</p> : null}
        {children}
      </Container>
    </div>
  );
}
