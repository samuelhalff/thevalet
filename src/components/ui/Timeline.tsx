import { cn } from "./cn";

/** A real sequence of steps: numbered in the display face, joined by the left edge. */
export default function Timeline({ items, className }: { items: { title: string; text: string }[]; className?: string }) {
  return (
    <ol className={cn("space-y-10", className)}>
      {items.map((s, i) => (
        <li key={s.title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4">
          <span aria-hidden="true" className="font-display text-[2rem] italic leading-none text-brand">
            {i + 1}
          </span>
          <div>
            <h3 className="t-3">{s.title}</h3>
            <p className="mt-2 max-w-xl text-muted">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
