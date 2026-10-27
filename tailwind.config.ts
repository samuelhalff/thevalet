import type { Config } from "tailwindcss";

const tone = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: tone("bg"),
        surface: tone("surface"),
        subtle: tone("subtle"),
        ink: tone("ink"),
        muted: tone("muted"),
        line: tone("line"),
        accent: tone("accent"),
        brand: tone("brand"),
        blush: tone("blush"),
        "accent-strong": tone("accent-strong"),
        danger: tone("danger"),
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-text)", "Helvetica Neue", "Arial", "sans-serif"],
      },
      fontSize: {
        base: ["1.0625rem", { lineHeight: "1.65" }],
      },
      borderRadius: {
        soft: "999px", // pill for buttons and toggles, echoing the arched photos (docs/DESIGN.md)
        panel: "12px",
      },
      maxWidth: { prose: "65ch" },
    },
  },
  plugins: [],
};

export default config;
