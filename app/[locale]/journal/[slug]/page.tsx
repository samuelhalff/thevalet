import { notFound } from "next/navigation";
import JournalArticle from "@/components/JournalArticle";
import { entryMetadata, entryStaticParams, resolveEntry, type EntryParams } from "@/lib/entry-route";

export const dynamicParams = false;
export const generateStaticParams = entryStaticParams("journal");
export const generateMetadata = entryMetadata("journal");

export default async function Page({ params }: { params: EntryParams }) {
  const r = await resolveEntry("journal", params);
  if (!r) notFound();
  return <JournalArticle locale={r.locale} entry={r.entry} />;
}
