import { describe, expect, it } from "vitest";
import type { Entry } from "./content";
import { articleLd, organizationLd, serviceLd } from "./jsonld";

const entry: Entry = {
  collection: "services",
  locale: "fr",
  slug: "chauffeur-prive-geneve",
  title: "Chauffeur privé à Genève",
  description: "Description",
  translationKey: "chauffeur",
  updated: "2026-10-26",
  draft: false,
  order: 2,
  summary: "",
  serviceType: "Chauffeur privé",
  delivery: "partner",
  answer: "",
  service: "",
  faq: [],
  sources: [],
  body: "",
};

describe("organizationLd", () => {
  it("is an Organization + LocalBusiness with the logo and no unverified profiles", () => {
    const ld = organizationLd("fr");
    expect(ld["@type"]).toEqual(["Organization", "LocalBusiness"]);
    expect(ld.logo).toMatch(/\/logo\.svg$/);
    expect(ld.sameAs).toEqual([]);
    // Unconfigured contact details are omitted, never faked.
    expect(ld).not.toHaveProperty("telephone");
    expect(ld).not.toHaveProperty("email");
    expect(ld).not.toHaveProperty("address");
  });
});

describe("serviceLd", () => {
  it("uses the market term and lists the regions served", () => {
    const ld = serviceLd(entry, "https://thevalet.ch/fr/services/chauffeur-prive-geneve/");
    expect(ld.serviceType).toBe("Chauffeur privé");
    expect(ld.areaServed.map((a) => a.name)).toEqual(
      expect.arrayContaining(["Genève", "Vaud", "Valais", "Haute-Savoie et Savoie"]),
    );
  });
});

describe("articleLd", () => {
  it("emits keywords only when the article has them", () => {
    const article = { ...entry, collection: "journal" as const };
    expect(articleLd(article, "https://thevalet.ch/fr/journal/x/")).not.toHaveProperty("keywords");
    expect(articleLd({ ...article, keywords: { primary: "chauffeur genève", secondary: ["vtc genève"] } }, "u")).toMatchObject({
      keywords: "chauffeur genève, vtc genève",
    });
  });
});
