/** Legacy preference types retained for the unused switch component. */
export type ThemePref = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "tv-theme";

/** Single owner-approved light palette, independent of saved or system preferences. */
export const THEME_COLORS: Record<"light" | "dark", string> = { light: "#ffffff", dark: "#ffffff" };

/** Reset legacy preferences before first paint, including on the not-found page. */
export const themeInitScript =
  `(function(){document.documentElement.setAttribute("data-theme","light");` +
  `var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","#ffffff");` +
  `try{localStorage.removeItem("${THEME_STORAGE_KEY}");}catch(e){}})();`;
