import { faqLd } from "@/lib/jsonld";
import JsonLd from "./JsonLd";
import { stripLinks, withLinks } from "./RichText";
import Icon from "./ui/Icon";
import SectionHeading from "./ui/SectionHeading";
import { cn } from "./ui/cn";

/**
 * FAQ on native <details> (answers are in the static HTML) with FAQPage JSON-LD. Answers may contain
 * "[label](/path/)" link markers. Set `schema={false}` when another FAQ on the page already emits it.
 */
export default function Faq({
  title,
  items,
  schema = true,
  compact = false,
  id = "faq",
  headingLevel = "h2",
}: {
  title?: string;
  items: { q: string; a: string }[];
  schema?: boolean;
  compact?: boolean;
  id?: string;
  headingLevel?: "h2" | "h3";
}) {
  if (!items.length) return null;
  const Q = headingLevel === "h2" ? "h3" : "h4";
  return (
    <section aria-labelledby={title ? `${id}-title` : undefined}>
      {title ? <SectionHeading id={`${id}-title`} as={headingLevel} title={title} size={compact ? "md" : "lg"} /> : null}
      <div className={cn("border-t border-line", title ? (compact ? "mt-6" : "mt-10") : "")}>
        {items.map((f) => (
          <details key={f.q} className="faq-item group border-b border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 sm:py-6">
              <Q className="t-3">{f.q}</Q>
              <span aria-hidden="true" className="faq-icon h-8 w-8 shrink-0 items-center justify-center text-brand">
                <Icon name="plus" size={20} />
              </span>
            </summary>
            <p className="max-w-2xl pb-6 text-muted">{withLinks(f.a)}</p>
          </details>
        ))}
      </div>
      {schema ? <JsonLd data={faqLd(items.map((f) => ({ q: f.q, a: stripLinks(f.a) })))} /> : null}
    </section>
  );
}
