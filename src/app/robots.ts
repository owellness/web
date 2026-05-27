import type { MetadataRoute } from "next";

import { SITE_URL } from "@/config/site";

// Explicitly allow major AI crawlers — this site is built for GEO so we
// *want* GPTBot, ClaudeBot, PerplexityBot and friends to ingest us.
// `/llms.txt` and `/llms-full.txt` (served by their respective route
// handlers) are discoverable directly without being listed here.
const AI_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/auth", "/api/newsletter"],
      },
      ...AI_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/admin", "/api/auth", "/api/newsletter"],
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
