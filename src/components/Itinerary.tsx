import Link from "next/link";

export type ItineraryItem = { href: string; title: string; promise: string; detail?: string };

/**
 * Services as an itinerary (docs/DESIGN.md): a bordeaux left edge, large service name, the
 * one-line promise, and a practical detail line. Not cards.
 */
export default function Itinerary({ items, size = "lg" }: { items: ItineraryItem[]; size?: "lg" | "md" }) {
  return (
    <ul className="itinerary">
      {items.map((i) => (
        <li key={i.href}>
          <Link
            href={i.href}
            className="group grid gap-x-10 gap-y-1 py-5 pl-6 transition-colors hover:bg-subtle/60 sm:pl-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-baseline"
          >
            <span className={`font-display ${size === "lg" ? "t-2" : "t-3"} transition-colors group-hover:text-brand`}>{i.title}</span>
            <span className="block">
              <span className="block text-[1.02rem]">{i.promise}</span>
              {i.detail ? <span className="t-small mt-1 block text-muted">{i.detail}</span> : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
