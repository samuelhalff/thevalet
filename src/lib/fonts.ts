import localFont from "next/font/local";

/*
 * Self-hosted (src/fonts, latin subset, variable weight, SIL Open Font License) so builds never
 * depend on fetching Google Fonts, which failed CI twice.
 */

/** Display only: Playfair Display, the logo's lettering (docs/DESIGN.md). */
export const display = localFont({
  src: [
    { path: "../fonts/PlayfairDisplay-normal.woff2", weight: "400 700", style: "normal" },
    { path: "../fonts/PlayfairDisplay-italic.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
});

/** Text and UI: Hanken Grotesk 400/500, plus 700 for bold titles. */
export const text = localFont({
  src: [{ path: "../fonts/HankenGrotesk-normal.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-text",
  display: "swap",
});
