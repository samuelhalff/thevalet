import Link from "next/link";
import type { ReactNode } from "react";

const LINK_RE = /\[([^\]]+)\]\((\/[^)\s]*|https:\/\/[^)\s]+)\)/g;

/** Plain text with "[label](/internal/path/)" and "[label](https://…)" markers rendered as links. */
export function withLinks(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK_RE)) {
    const i = m.index ?? 0;
    if (i > last) out.push(text.slice(last, i));
    const href = m[2];
    out.push(
      href.startsWith("/") ? (
        <Link key={i} href={href} className="link">
          {m[1]}
        </Link>
      ) : (
        <a key={i} href={href} className="link" target="_blank" rel="noopener noreferrer">
          {m[1]}
        </a>
      ),
    );
    last = i + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Text without link markers (for JSON-LD and meta). */
export function stripLinks(text: string): string {
  return text.replace(LINK_RE, "$1");
}

export default function RichText({ text, as: Tag = "p", className }: { text: string; as?: "p" | "span" | "div"; className?: string }) {
  return <Tag className={className}>{withLinks(text)}</Tag>;
}
