import { notFound } from "next/navigation";
import ServicePage from "@/components/ServicePage";
import { getByKey } from "@/lib/content";
import { entryMetadata, entryStaticParams, resolveEntry, type EntryParams } from "@/lib/entry-route";

export const dynamicParams = false;
export const generateStaticParams = entryStaticParams("services");
export const generateMetadata = entryMetadata("services");

export default async function Page({ params }: { params: EntryParams }) {
  const r = await resolveEntry("services", params);
  if (!r) notFound();
  // Retain old service addresses and metadata while showing the combined content.
  const mergedKey = { medical: "concierge", "child-transport": "chauffeur" }[r.entry.translationKey];
  const combined = mergedKey ? getByKey(r.locale, "services", mergedKey) : undefined;
  const entry = combined ? { ...r.entry, body: combined.body, faq: combined.faq } : r.entry;
  return <ServicePage locale={r.locale} entry={entry} />;
}
