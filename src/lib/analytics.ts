/**
 * GA4 event helper. No-ops when gtag is absent (no GA ID, consent not given, or server render).
 * Events: request_start, request_step_{n}, generate_lead (method=request|contact_form),
 * contact_channel_click (channel=whatsapp|phone|email).
 * Never pass personal data or form content here (not even the chosen service).
 */
type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

export type AnalyticsEvent =
  | "request_start"
  | `request_step_${number}`
  | "generate_lead"
  | "contact_channel_click";

export function trackEvent(name: AnalyticsEvent, params: Record<string, string | number | boolean> = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
