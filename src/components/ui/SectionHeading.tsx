import type { ReactNode } from "react";
import { cn } from "./cn";
import { plainTitle } from "@/lib/typography";

const titleSizes = {
  hero: "t-hero",
  xl: "t-1",
  lg: "t-2",
  md: "t-3",
} as const;

export type HeadingSize = keyof typeof titleSizes;

/** Display heading (Playfair) + optional lead. No eyebrow, no accented word (docs/DESIGN.md). */
export default function SectionHeading({
  title,
  lead,
  as: Tag = "h2",
  size = "lg",
  id,
  className,
  children,
}: {
  title: string;
  lead?: string;
  as?: "h1" | "h2" | "h3";
  size?: HeadingSize;
  id?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <Tag id={id} className={titleSizes[size]}>
        {plainTitle(title)}
      </Tag>
      {lead ? <p className="t-lead mt-5 max-w-2xl text-muted">{lead}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
