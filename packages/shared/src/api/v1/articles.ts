import { z } from "zod";

import { paginationQuerySchema } from "./common";

/** GET /api/v1/articles 쿼리 — 공개 아티클 피드. */
export const articleFeedQuerySchema = paginationQuerySchema.extend({
  category: z.string().min(1).optional(),
  sort: z.enum(["latest", "popular"]).default("latest"),
});
export type ArticleFeedQuery = z.infer<typeof articleFeedQuerySchema>;

export const articleFeedItemSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  categorySlug: z.string(),
  authorName: z.string(),
  ogImageUrl: z.string().nullable(),
  readingTimeSec: z.number().int().nonnegative(),
  publishedAt: z.iso.datetime().nullable(),
});
export type ArticleFeedItem = z.infer<typeof articleFeedItemSchema>;

export const articleFeedResponseSchema = z.object({
  items: z.array(articleFeedItemSchema),
  nextCursor: z.string().nullable(),
});
export type ArticleFeedResponse = z.infer<typeof articleFeedResponseSchema>;
