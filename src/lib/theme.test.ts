import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { themeInitScript, THEME_STORAGE_KEY } from "./theme";

describe("single light appearance for returning visitors", () => {
  it.each(["dark", "system", "light"])("clears a saved %s preference before rendering", (saved) => {
    const storage = new Map([[THEME_STORAGE_KEY, saved]]);
    const attributes = new Map<string, string>();
    let themeColor = "#1a1215";
    runInNewContext(themeInitScript, {
      document: {
        documentElement: { setAttribute: (key: string, value: string) => attributes.set(key, value) },
        querySelector: () => ({ setAttribute: (_key: string, value: string) => { themeColor = value; } }),
      },
      localStorage: { removeItem: (key: string) => storage.delete(key) },
    });
    expect(attributes.get("data-theme")).toBe("light");
    expect(themeColor).toBe("#ffffff");
    expect(storage.has(THEME_STORAGE_KEY)).toBe(false);
  });

  it("keeps light mode when browser storage is blocked", () => {
    let theme = "";
    runInNewContext(themeInitScript, {
      document: {
        documentElement: { setAttribute: (_key: string, value: string) => { theme = value; } },
        querySelector: () => null,
      },
      localStorage: { removeItem: () => { throw new Error("Storage blocked"); } },
    });
    expect(theme).toBe("light");
  });
});
