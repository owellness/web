import type { MetadataRoute } from "next";

import { articleService, tagService } from "@/composition";
import { CATEGORIES, SITE_URL } from "@/config/site";

export const revalidate = 600;

const safe = async <T>(p: Promise<T>, fallback: T): Promise<T> =>
  p.catch((err) => {
    console.warn("[sitemap]", err);
    return fallback;
  });

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
