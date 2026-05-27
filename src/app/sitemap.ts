import type { MetadataRoute } from "next";

import { CATEGORIES, SITE_URL } from "@/config/site";
import { articleService } from "@/composition";

export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const baseRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
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
    ...CATEGORIES.map((cat) => ({
      url: `${SITE_URL}/${cat.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  // Article URLs are added from the DB. If the DB isn't reachable (e.g. local
  // dev without env), fall back to the static routes so the sitemap still
  // builds.
  try {
    const articles = await articleService.listForSitemap();
    return [
      ...baseRoutes,
      ...articles.map((a) => ({
        url: `${SITE_URL}/${a.primaryCategorySlug}/${a.slug}`,
        lastModified: a.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch (error) {
    console.warn("[sitemap] Skipping article URLs:", error);
    return baseRoutes;
  }
}
