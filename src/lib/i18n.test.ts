import { describe, expect, it } from "vitest";
import en from "@/i18n/en.json";
import fr from "@/i18n/fr.json";
import { defaultLocale, getMessages, locales, t } from "./i18n";

/** Every string leaf of a message tree. */
function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}

describe("locales", () => {
  it("are fr (default) and en only", () => {
    expect(locales).toEqual(["fr", "en"]);
    expect(defaultLocale).toBe("fr");
  });
});

describe("getMessages", () => {
  it("leaves no straight apostrophe between letters anywhere in fr", () => {
    for (const s of strings(getMessages("fr"))) expect(s).not.toMatch(/\p{L}'\p{L}/u);
  });

  it("agrees with t() for plain keys", () => {
    expect(getMessages("fr").channels.title).toBe(t("fr", "channels.title"));
  });

  it("does not mutate the source dictionary and memoises per locale", () => {
    expect(getMessages("fr")).toBe(getMessages("fr"));
    expect(strings(fr).some((s) => /\p{L}'\p{L}/u.test(s))).toBe(true);
  });

  it("returns en unchanged", () => {
    expect(getMessages("en")).toEqual(en);
  });

  it("uses the exact availability wording", () => {
    expect(fr.common.availability).toBe("Demandes reçues 24 h/24, 7 j/7 ; délais et disponibilité confirmés pour chaque demande.");
    expect(en.common.availability).toBe("Requests received 24 hours a day, 7 days a week; lead times and availability confirmed for each request.");
  });
});
