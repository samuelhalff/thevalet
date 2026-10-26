import { t, type Locale, type TKey } from "./i18n";

/**
 * Photo slots. No photography is licensed yet: every slot renders a soft tonal placeholder
 * (ImageSlot) that still carries its alt text. To add a photo, put a webp in public/images/
 * and set `src` here; nothing else changes.
 */
type ImageDef = { src?: string; altKey: TKey; captionKey: TKey };

export const images = {
  hero: { altKey: "imageAlt.hero", captionKey: "imageCaption.hero" },
  chalet: { altKey: "imageAlt.chalet", captionKey: "imageCaption.chalet" },
  geneva: { altKey: "imageAlt.geneva", captionKey: "imageCaption.geneva" },
  event: { altKey: "imageAlt.event", captionKey: "imageCaption.event" },
  beauty: { altKey: "imageAlt.beauty", captionKey: "imageCaption.beauty" },
  residence: { altKey: "imageAlt.residence", captionKey: "imageCaption.residence" },
  car: { altKey: "imageAlt.car", captionKey: "imageCaption.car" },
  alps: { altKey: "imageAlt.alps", captionKey: "imageCaption.alps" },
} satisfies Record<string, ImageDef>;

export type ImageName = keyof typeof images;

export function imageSrc(name: ImageName): string | undefined {
  return (images[name] as ImageDef).src;
}

export function imageAlt(name: ImageName, locale: Locale): string {
  return t(locale, images[name].altKey);
}

export function imageCaption(name: ImageName, locale: Locale): string {
  return t(locale, images[name].captionKey);
}

/** Header image per service (translationKey). */
const byService: Record<string, ImageName> = {
  concierge: "residence",
  chauffeur: "car",
  "alpine-transfers": "alps",
  "child-transport": "car",
  "residence-management": "residence",
  chalets: "chalet",
  events: "event",
  "glam-team": "beauty",
  medical: "geneva",
  security: "geneva",
  "legal-real-estate": "geneva",
};

export function imageForEntry(entry: { collection: string; translationKey: string }): ImageName {
  return byService[entry.translationKey] ?? (entry.collection === "journal" ? "geneva" : "residence");
}
