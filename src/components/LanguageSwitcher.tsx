"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Props = {
  current: string;
  label: string;
  languages: { code: string; name: string }[];
};

/**
 * Links each language to the translated equivalent of the current page. Slugs differ per locale,
 * so the target comes from the page's own <link rel="alternate" hreflang> tags (rendered from
 * the route registry / translationKey); without one the language's home page is used.
 */
export default function LanguageSwitcher({ current, label, languages }: Props) {
  const [targets, setTargets] = useState<Record<string, string>>({});
  const pathname = usePathname();

  useEffect(() => {
    const found: Record<string, string> = {};
    for (const l of languages) {
      const link = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${l.code}"]`);
      if (link?.href) {
        try {
          const u = new URL(link.href);
          found[l.code] = u.pathname;
        } catch {
          /* keep home */
        }
      }
    }
    setTargets(found);
    // Re-read after client-side navigation (the head's alternates change with the page).
  }, [languages, pathname]);

  return (
    <nav aria-label={label}>
      <ul className="flex items-center gap-1 text-sm">
        {languages.map((l) => (
          <li key={l.code}>
            <a
              href={targets[l.code] ?? `/${l.code}/`}
              hrefLang={l.code}
              lang={l.code}
              aria-current={l.code === current ? "true" : undefined}
              title={l.name}
              className={`inline-flex min-h-[36px] min-w-[32px] items-center justify-center px-1.5 text-[0.9rem] font-medium underline-offset-[6px] ${
                l.code === current ? "text-ink underline decoration-1" : "text-muted hover:text-ink"
              }`}
            >
              <span aria-hidden="true">{l.code.toUpperCase()}</span>
              <span className="sr-only">{l.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
