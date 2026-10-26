import type { MetadataRoute } from "next";
import { NOINDEX, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/** Answer-engine crawlers are welcome once the site is indexable; NOINDEX blocks everything. */
export const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "PerplexityBot", "ClaudeBot"] as const;

export default function robots(): MetadataRoute.Robots {
  if (NOINDEX) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/" })), { userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
