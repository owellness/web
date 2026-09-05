import type { MetadataRoute } from "next";

import { ALL_CODES } from "@/application/owti";
import { articleService, categoryService, tagService } from "@/composition";
import { SITE_URL } from "@/config/site";

// Render the sitemap on-demand from the live database on every request.
// sitemap routes are cached by default in Next.js, and that default bit us: a
// stale ISR entry froze the sitemap for days so newly published articles never
// showed up. This is a low-traffic, crawler-facing route, so the per-request DB
// query is a cheap price for a sitemap that always reflects the current set of
// published articles (and instantly backfills any previously missing ones).
export const dynamic = "force-dynamic";

const safe = async <T>(p: Promise<T>, fallback: T): Promise<T> =>
  p.catch((err) => {
    console.warn("[sitemap]", err);
    return fallback;
  });

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const cats = await safe(categoryService.listAll(), []);

  const baseRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/newsletter`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date("2026-09-05T00:00:00+09:00"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/owti`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...ALL_CODES.map((code) => ({
      url: `${SITE_URL}/owti/result/${code}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...cats.map((cat) => ({
      url: `${SITE_URL}/${cat.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  const articles = await safe(articleService.listForSitemap(), []);
  const tags = await safe(tagService.listAll(), []);

  return [
    ...baseRoutes,
    ...articles.map((a) => ({
      url: `${SITE_URL}/${a.primaryCategorySlug}/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...tags.map((t) => ({
      url: `${SITE_URL}/tags/${t.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
  ];
}
