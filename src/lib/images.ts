import { t, type Locale, type TKey } from "./i18n";

/**
 * Photography (docs/DESIGN.md, Photography). Few photos, each graded with
 * scripts/brand/grade_photos.py and credited in public/images/CREDITS.md.
 * A slot without `src` renders nothing; swap in the owner's own photos here when they arrive.
 * `captionKey` only when the photo page states the place.
 */
type ImageDef = { src?: string; altKey: TKey; captionKey?: TKey };

export const images = {
  alps: { src: "/images/alps.webp", altKey: "imageAlt.alps", captionKey: "imageCaption.alps" },
  chalet: { src: "/images/chalet.webp", altKey: "imageAlt.chalet", captionKey: "imageCaption.chalet" },
  road: { src: "/images/road.webp", altKey: "imageAlt.road", captionKey: "imageCaption.road" },
  chauffeur: { src: "/images/chauffeur.webp", altKey: "imageAlt.chauffeur" },
  table: { src: "/images/table.webp", altKey: "imageAlt.table" },
  glam: { src: "/images/glam.webp", altKey: "imageAlt.glam" },
} satisfies Record<string, ImageDef>;

export type ImageName = keyof typeof images;

export function imageSrc(name: ImageName): string | undefined {
  return (images[name] as ImageDef).src;
}

export function imageAlt(name: ImageName, locale: Locale): string {
  return t(locale, images[name].altKey);
}

export function imageCaption(name: ImageName, locale: Locale): string | undefined {
  const key = (images[name] as ImageDef).captionKey;
  return key ? t(locale, key) : undefined;
}

/** The few service pages that carry a photo in their header (by translationKey). */
const byService: Record<string, ImageName> = {
  chalets: "chalet",
  "alpine-transfers": "road",
  chauffeur: "chauffeur",
  events: "table",
  "glam-team": "glam",
};

export function serviceImage(translationKey: string): ImageName | undefined {
  return byService[translationKey];
}
