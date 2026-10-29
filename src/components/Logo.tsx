/** Decorative V retained for existing illustrations; wordmark supplied by the owner. */
export const MARK_VIEWBOX = "-9 -3 431 431";
export const V_PATH =
  "M11.0 106.0C37.0 97.0 76.0 104.0 103.0 124.0C124.0 139.0 135.0 163.0 146.0 192.0C159.0 227.0 175.0 275.0 197.0 340.0C231.0 242.0 264.0 149.0 295.0 86.0C319.0 37.0 349.0 1.0 377.0 0.0C393.0 -1.0 404.0 10.0 404.0 24.0C404.0 37.0 396.0 44.0 382.0 45.0C350.0 48.0 323.0 67.0 301.0 103.0C269.0 157.0 238.0 244.0 205.0 340.0L180.0 419.0C178.0 424.0 173.0 425.0 170.0 419.0C146.0 354.0 121.0 293.0 96.0 239.0C73.0 188.0 51.0 143.0 28.0 132.0C19.0 127.0 12.0 128.0 7.0 124.0C-2.0 120.0 -1.0 110.0 11.0 106.0Z";
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox={MARK_VIEWBOX} aria-hidden="true" focusable="false">
      <path fill="rgb(var(--brand))" d={V_PATH} />
    </svg>
  );
}

/** Wordmark uses the same Playfair Display lettering as the home heading. */
export default function Logo({ className = "h-8 w-auto", decorative = false }: { className?: string; decorative?: boolean }) {
  return (
    <svg className={`logo-wordmark ${className}`} viewBox="0 0 180 46"
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": "The Valet" })}
      focusable="false">
      <text x="0" y="36" className="font-display" fontSize="32" style={{ fontWeight: 700 }} fill="currentColor">The Valet.</text>
      <path className="logo-swiss-red" d="M154 7h16v16h-16z" />
      <path className="logo-swiss-white" d="M160.53 10.17h2.94v3.36h3.36v2.94h-3.36v3.36h-2.94v-3.36h-3.36v-2.94h3.36z" />
    </svg>
  );
}
