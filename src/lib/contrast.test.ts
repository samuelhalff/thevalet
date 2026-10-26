import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** WCAG AA check of the design tokens in app/globals.css (light, dark, bordeaux band). */
const css = fs.readFileSync(path.join(__dirname, "../../app/globals.css"), "utf8");

function block(selector: string): Record<string, number[]> {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  const out: Record<string, number[]> = {};
  for (const m of body.matchAll(/--([\w-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) out[m[1]] = [+m[2], +m[3], +m[4]];
  return out;
}

const lum = ([r, g, b]: number[]) => {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: number[], b: number[]) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const light = block(":root {");
const dark = { ...light, ...block(':root[data-theme="dark"]') };

describe.each([
  ["light", light],
  ["dark", dark],
])("%s theme", (_name, t) => {
  it("body, muted and link text pass AA (4.5:1) on paper and on the note surface", () => {
    for (const bg of [t.bg, t.surface, t.subtle]) {
      expect(ratio(t.ink, bg)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t.muted, bg)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t.brand, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("primary button text passes AA", () => {
    expect(ratio(t.bg, t.brand)).toBeGreaterThanOrEqual(4.5);
  });
  it("text on the bordeaux band passes AA", () => {
    expect(ratio(t["band-fg"], t["band-bg"])).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t["band-muted"], t["band-bg"])).toBeGreaterThanOrEqual(4.5);
    // band primary button: bordeaux text on blush
    expect(ratio(t["band-bg"], t["band-fg"])).toBeGreaterThanOrEqual(4.5);
  });
});
