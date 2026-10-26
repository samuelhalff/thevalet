import { V_PATH, MARK_VIEWBOX } from "./Logo";

/** The logo's V drawing itself once (CSS stroke animation; static under prefers-reduced-motion). */
export default function HeroCheck({ className = "" }: { className?: string }) {
  return (
    <svg className={`hero-check ${className}`} viewBox={MARK_VIEWBOX} aria-hidden="true" focusable="false">
      <path d={V_PATH} pathLength={1} />
    </svg>
  );
}
