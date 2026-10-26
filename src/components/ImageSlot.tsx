import type { CSSProperties } from "react";
import { imageAlt, imageSrc, type ImageName } from "@/lib/images";
import type { Locale } from "@/lib/i18n";

/**
 * Photo slot, rendered only when a real photograph is configured in src/lib/images.ts
 * (docs/DESIGN.md: no stock, no empty placeholders). Always carries alt text.
 */
export default function ImageSlot({
  name,
  locale,
  className = "",
  position,
  priority,
}: {
  name: ImageName;
  locale: Locale;
  className?: string;
  position?: string;
  priority?: boolean;
}) {
  const src = imageSrc(name);
  if (!src) return null;
  const style = (position ? { "--img-pos": position } : undefined) as CSSProperties | undefined;
  return (
    <div className={`img-slot ${className}`} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, images are pre-sized webp */}
      <img src={src} alt={imageAlt(name, locale)} decoding="async" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} />
    </div>
  );
}
