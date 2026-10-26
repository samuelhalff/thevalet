import { describe, expect, it } from "vitest";
import {
  ACRONYMS,
  applyAcronyms,
  applyCountryNames,
  capitalizeFirst,
  normalizeArticleCasing,
  normalizeH2Headings,
  normalizeTitleCasing,
  startsWithLowercase,
} from "./title-case.mjs";

describe("capitalizeFirst", () => {
  it("capitalises the first letter of a plain string", () => {
    expect(capitalizeFirst("private chauffeur in Geneva")).toBe("Private chauffeur in Geneva");
  });

  it("leaves leading Markdown markers untouched", () => {
    expect(capitalizeFirst("## what should you know?")).toBe("## What should you know?");
  });

  it("never lowercases an already-uppercase first letter", () => {
    expect(capitalizeFirst("VIP arrivals explained")).toBe("VIP arrivals explained");
  });

  it("is a no-op on empty/non-string input", () => {
    expect(capitalizeFirst("")).toBe("");
    expect(capitalizeFirst(undefined)).toBe(undefined);
  });
});

describe("applyAcronyms", () => {
  it.each(ACRONYMS)("uppercases %s as a whole word regardless of input case", (acro) => {
    const input = `the ${acro.toLowerCase()} rule applies`;
    expect(applyAcronyms(input)).toBe(`the ${acro} rule applies`);
  });

  it("does not touch substrings that are not whole words", () => {
    // "US" must not match inside "using" or "house"
    expect(applyAcronyms("using the house rules")).toBe("using the house rules");
  });

  it("handles multiple acronyms in one string (EN)", () => {
    expect(applyAcronyms("vip and vtc transfers from gva")).toBe("VIP and VTC transfers from GVA");
  });

  it("handles acronyms in French text", () => {
    expect(applyAcronyms("un transfert vtc depuis l'aéroport gva")).toBe("un transfert VTC depuis l'aéroport GVA");
  });
});

describe("applyCountryNames", () => {
  it("capitalises places in both locales", () => {
    expect(applyCountryNames("a weekend in geneva")).toBe("a weekend in Geneva");
    expect(applyCountryNames("un séjour en suisse")).toBe("un séjour en Suisse");
    expect(applyCountryNames("arriving in courchevel")).toBe("arriving in Courchevel");
  });

  it("capitalises United Kingdom / Royaume-Uni", () => {
    expect(applyCountryNames("flying from the united kingdom")).toBe("flying from the United Kingdom");
    expect(applyCountryNames("depuis le royaume-uni")).toBe("depuis le Royaume-Uni");
  });

  it("capitalises other known country names (US/France)", () => {
    expect(applyCountryNames("flying from the united states")).toBe("flying from the United States");
    expect(applyCountryNames("les alpes en france")).toBe("les alpes en France");
  });
});

describe("normalizeTitleCasing", () => {
  it("capitalises an autocomplete-style lowercase EN title and its acronym", () => {
    expect(normalizeTitleCasing("vip arrival at geneva airport: what to expect")).toBe("VIP arrival at Geneva airport: what to expect");
  });

  it("capitalises an autocomplete-style lowercase FR title", () => {
    expect(normalizeTitleCasing("chauffeur vtc à zermatt : ce qu'il faut savoir")).toBe("Chauffeur VTC à Zermatt : ce qu'il faut savoir");
  });

  it("is idempotent", () => {
    const once = normalizeTitleCasing("vip weekends for us visitors in verbier");
    expect(normalizeTitleCasing(once)).toBe(once);
  });

  it("only ever raises case, never lowers it", () => {
    const input = "Chalet Opening, Ski Passes and the VIP Lounge";
    expect(normalizeTitleCasing(input)).toBe(input);
  });

  it("is a no-op on empty/non-string input", () => {
    expect(normalizeTitleCasing("")).toBe("");
    expect(normalizeTitleCasing(null)).toBe(null);
  });
});

describe("normalizeH2Headings", () => {
  it("capitalises the first letter of every H2 heading, leaving other lines untouched", () => {
    const body = ["intro paragraph.", "", "## when should you book?", "some text.", "### not touched (h3)", "## vip arrivals explained"].join("\n");
    const out = normalizeH2Headings(body);
    expect(out).toContain("## When should you book?");
    expect(out).toContain("## VIP arrivals explained");
    expect(out).toContain("### not touched (h3)");
    expect(out).toContain("intro paragraph.");
  });

  it("does not touch an H1 line", () => {
    const body = "# a top-level heading\n\n## a sub heading";
    const out = normalizeH2Headings(body);
    expect(out).toContain("# a top-level heading");
    expect(out).toContain("## A sub heading");
  });
});

describe("normalizeArticleCasing", () => {
  it("normalises title, description, faq questions and H2 headings on a {data, body} article", () => {
    const article = {
      data: {
        title: "vip arrival in geneva: a practical note",
        description: "vtc transfers and chalet openings for guests arriving from the united kingdom.",
        faq: [
          { q: "what is a vip arrival?", a: "an explanation." },
          { q: "How does a VTC transfer work?", a: "an explanation." },
        ],
      },
      body: "Intro.\n\n## vtc transfers explained\n\nMore text.\n\n## how we help\n\nLink.",
    };
    normalizeArticleCasing(article);
    expect(article.data.title).toBe("VIP arrival in Geneva: a practical note");
    expect(article.data.description).toBe("VTC transfers and chalet openings for guests arriving from the United Kingdom.");
    expect(article.data.faq[0].q).toBe("What is a VIP arrival?");
    expect(article.data.faq[1].q).toBe("How does a VTC transfer work?");
    expect(article.body).toContain("## VTC transfers explained");
    expect(article.body).toContain("## How we help");
  });

  it("is a no-op on a non-object", () => {
    expect(normalizeArticleCasing(null)).toBe(null);
  });
});

describe("startsWithLowercase", () => {
  it("flags a lowercase leading letter", () => {
    expect(startsWithLowercase("private chauffeur")).toBe(true);
  });

  it("does not flag an uppercase leading letter", () => {
    expect(startsWithLowercase("Private chauffeur")).toBe(false);
  });

  it("skips leading digits/punctuation to find the first letter", () => {
    // Leading non-letters are skipped entirely; the check is on the first *letter*.
    expect(startsWithLowercase("3 Chalets ready")).toBe(false);
    expect(startsWithLowercase("3 chalets ready")).toBe(true);
    expect(startsWithLowercase('"Quoted" title')).toBe(false);
  });

  it("is false for empty/non-string input", () => {
    expect(startsWithLowercase("")).toBe(false);
    expect(startsWithLowercase(undefined)).toBe(false);
  });
});
