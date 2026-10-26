import type { Entry } from "./content";
import { t, type Locale } from "./i18n";
import { localePath } from "./paths";
import type { ItineraryItem } from "@/components/Itinerary";

/** Itinerary rows for service entries: name, one-line promise, who delivers it. */
export function serviceItinerary(locale: Locale, entries: Entry[]): ItineraryItem[] {
  return entries.map((e) => ({
    href: localePath(locale, `/services/${e.slug}/`),
    title: e.title,
    promise: e.summary,
    detail: e.delivery === "partner" ? t(locale, "service.deliveryPartnerShort") : t(locale, "service.deliveryCoordinatedShort"),
  }));
}
