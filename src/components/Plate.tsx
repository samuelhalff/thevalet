import { imageAlt, imageCaption, imageSrc, type ImageName } from "@/lib/images";
import type { Locale } from "@/lib/i18n";
import { cn } from "./ui/cn";

/**
 * A photographic plate (docs/DESIGN.md, "Photography"): one graded photo in an arched 4:5 frame
 * with a bordeaux keyline, and a place caption when the source states the place.
 * Renders nothing when the slot has no photo.
 */
export default function Plate({
  name,
  locale,
  className,
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
  const caption = imageCaption(name, locale);
  return (
    <figure className={cn("plate", className)}>
      <div className="plate-print">
        <div className="plate-frame">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, images are pre-sized webp */}
          <img
            src={src}
            alt={imageAlt(name, locale)}
            decoding="async"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            style={position ? { objectPosition: position } : undefined}
          />
        </div>
      </div>
      {caption ? (
        <figcaption className="plate-caption">
          <span className="phrase">{caption}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}
