import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import type { ArticleSummary } from "@/application/articles/model";
import type { SearchPort } from "@/application/search/ports";
import { type CategorySlug } from "@/config/site";

import { buildQueryTokens } from "@/infrastructure/content/koreanTokens";
import { db } from "@/infrastructure/db/client";
import { articles, authors, categories } from "@/infrastructure/db/schema";

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

export const postgresFtsAdapter: SearchPort = {
  async searchArticles(query, limit) {
    const tokens = buildQueryTokens(query);
    if (!tokens.raw) return [];

    const rawPattern = `%${escapeLike(tokens.raw)}%`;
    const jamoPattern = `%${escapeLike(tokens.jamo)}%`;
    const choPattern = `%${escapeLike(tokens.choseong)}%`;

    const conditions = [
      eq(articles.status, "published"),
      or(
        ilike(articles.searchText, rawPattern),
        ilike(articles.searchText, jamoPattern),
        // Choseong query is only meaningful when the user typed at least
        // two initial consonants — otherwise we'd match too many articles.
        tokens.choseong.length >= 2
          ? ilike(articles.searchText, choPattern)
          : undefined,
      ),
    ].filter(Boolean);

    const rows = await db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        excerpt: articles.excerpt,
        status: articles.status,
        publishedAt: articles.publishedAt,
        updatedAt: articles.updatedAt,
        readingTimeSec: articles.readingTimeSec,
        viewCount: articles.viewCount,
        ogImageUrl: articles.ogImageUrl,
        categorySlug: categories.slug,
        authorSlug: authors.slug,
        authorName: authors.displayName,
        // Rank exact title matches first.
        rank: sql<number>`
          case
            when lower(${articles.title}) like ${rawPattern} then 3
            when ${articles.searchText} like ${rawPattern} then 2
            else 1
          end
        `.as("rank"),
      })
      .from(articles)
      .innerJoin(authors, eq(articles.authorId, authors.id))
      .innerJoin(categories, eq(articles.primaryCategoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(sql`rank`), desc(articles.publishedAt))
      .limit(limit);

    return rows.map(
      (r): ArticleSummary => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        excerpt: r.excerpt,
        status: r.status,
        publishedAt: r.publishedAt,
        updatedAt: r.updatedAt,
        readingTimeSec: r.readingTimeSec,
        viewCount: r.viewCount,
        primaryCategorySlug: r.categorySlug as CategorySlug,
        authorSlug: r.authorSlug,
        authorName: r.authorName,
        ogImageUrl: r.ogImageUrl,
      }),
    );
  },
};
