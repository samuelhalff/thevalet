import { describe, expect, it } from "vitest";
import { isAllowedSiteUrl } from "./site";

describe("isAllowedSiteUrl", () => {
  it("accepts production and preview hosts", () => {
    for (const u of ["https://thevalet.ch", "https://www.thevalet.ch", "https://thevalet.ark-fid.ch", "https://thevalet.houle.ai", "http://localhost:3100"]) {
      expect(isAllowedSiteUrl(u)).toBe(true);
    }
  });
  it("rejects any other domain", () => {
    for (const u of ["https://example.com", "https://thevalet.ch.evil.com", "https://ark-fid.ch", "not a url"]) {
      expect(isAllowedSiteUrl(u)).toBe(false);
    }
  });
});
