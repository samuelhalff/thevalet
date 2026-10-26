import { Hanken_Grotesk, Playfair_Display } from "next/font/google";

/** Display only: Playfair Display, the logo's lettering (docs/DESIGN.md). */
export const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

/** Text and UI: Hanken Grotesk 400/500. */
export const text = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-text",
  display: "swap",
});
