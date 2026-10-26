/**
 * Reference-source policy for published journal articles.
 *
 * Public `sources` must point to official authorities. A small second tier ("institutional":
 * tourism boards, airports, resorts) is tolerated for practical facts but never counts towards
 * the minimum number of official sources. Anything else — press, competitors, partners, our own
 * site — is rejected.
 *
 * STUB (The Valet): the domain lists below are a neutral starting point (public portals of the
 * places The Valet operates in: Geneva, Vaud, Valais, the French Alps). Review them together with
 * the editorial brief before re-enabling the pipeline.
 *
 * Runtime additions: REFERENCE_ALLOWED_DOMAINS="example.gov,other.gov" (comma-separated).
 * The blocklist always wins over runtime additions.
 */

/** Official sources. A domain matches itself and any subdomain (admin.ch covers fedlex.admin.ch). */
export const OFFICIAL_DOMAINS = [
  // Swiss federal government and portal
  "admin.ch",
  "ch.ch",
  // Geneva, Vaud, Valais (official portals)
  "ge.ch",
  "vd.ch",
  "vs.ch",
  // France (French Alps side)
  "service-public.fr",
  "legifrance.gouv.fr",
  "gouv.fr",
  // International
  "europa.eu",
];

/** Tolerated for practical facts (tourism boards, airports); never counted as official. */
export const INSTITUTIONAL_DOMAINS = [
  "geneve.com",
  "gva.ch",
  "region-du-leman.ch",
  "valais.ch",
  "gstaad.ch",
  "verbier.ch",
  "zermatt.ch",
  "chamonix.com",
  "courchevel.com",
  "megeve.com",
];

/** Never allowed, even via REFERENCE_ALLOWED_DOMAINS: our own site, aggregators, social networks. */
export const BLOCKED_DOMAINS = [
  "thevalet.ch",
  "wikipedia.org", "reddit.com", "quora.com", "medium.com", "linkedin.com", "facebook.com",
  "instagram.com", "tripadvisor.com",
];

export function parseDomainList(raw) {
  return String(raw || "")
    .split(/[,\s]+/)
    .map((d) => d.trim().toLowerCase().replace(/^\*\./, ""))
    .filter(Boolean);
}

export function hostnameOf(url) {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return null;
    return u.hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return null;
  }
}

const matches = (host, domain) => host === domain || host.endsWith(`.${domain}`);

/**
 * Classify a source URL: "official" | "institutional" | "blocked" | "disallowed" | "invalid".
 * @param {string} url
 * @param {{ extraAllowed?: string[] }} [opts]
 */
export function classifySource(url, opts = {}) {
  const host = hostnameOf(url);
  if (!host) return "invalid";
  if (BLOCKED_DOMAINS.some((d) => matches(host, d))) return "blocked";
  const extra = opts.extraAllowed ?? parseDomainList(process.env.REFERENCE_ALLOWED_DOMAINS);
  if ([...OFFICIAL_DOMAINS, ...extra].some((d) => matches(host, d))) return "official";
  if (INSTITUTIONAL_DOMAINS.some((d) => matches(host, d))) return "institutional";
  return "disallowed";
}

export function isAllowedSource(url, opts) {
  const c = classifySource(url, opts);
  return c === "official" || c === "institutional";
}
