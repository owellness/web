import { and, desc, eq, inArray, sql } from "drizzle-orm";

import type {
  Article,
  ArticleSummary,
  TiptapDocument,
} from "@/application/articles/model";
import type {
  ArticleListFilter,
  ArticleRepository,
  ArticleStorageInput,
} from "@/application/articles/ports";
import { notFound } from "@/application/shared/errors";
import type { Paginated, Pagination } from "@/application/shared/pagination";
import { type CategorySlug } from "@/config/site";

import { buildArticleSearchBlob } from "@/infrastructure/content/koreanTokens";
import { db } from "@/infrastructure/db/client";
import {
  articles,
  articleTags,
  authors,
  categories,
  tags,
} from "@/infrastructure/db/schema";

type ArticleRow = typeof articles.$inferSelect;
type AuthorRow = typeof authors.$inferSelect;
type CategoryRow = typeof categories.$inferSelect;
type TagRow = typeof tags.$inferSelect;

type ArticleWithRelations = ArticleRow & {
  author: AuthorRow;
  primaryCategory: CategoryRow;
  medicalReviewer: AuthorRow | null;
  tags: { tag: TagRow }[];
};

const mapArticle = (row: ArticleWithRelations): Article => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  tldr: row.tldr,
  contentJson: row.contentJson as TiptapDocument,
  contentHtml: row.contentHtml,
  status: row.status,
  publishedAt: row.publishedAt,
  updatedAt: row.updatedAt,
  readingTimeSec: row.readingTimeSec,
  primaryCategorySlug: row.primaryCategory.slug as CategorySlug,
  authorSlug: row.author.slug,
  authorName: row.author.displayName,
  ogImageUrl: row.ogImageUrl,
  seoTitle: row.seoTitle,
  seoDescription: row.seoDescription,
  canonicalUrl: row.canonicalUrl,
  tags: row.tags.map(({ tag }) => ({ slug: tag.slug, name: tag.name })),
  medicalReviewer: row.medicalReviewer
    ? {
        slug: row.medicalReviewer.slug,
        name: row.medicalReviewer.displayName,
      }
    : null,
});

const mapSummary = (
  row: ArticleRow & { author: AuthorRow; primaryCategory: CategoryRow },
): ArticleSummary => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  status: row.status,
  publishedAt: row.publishedAt,
  updatedAt: row.updatedAt,
  readingTimeSec: row.readingTimeSec,
  primaryCategorySlug: row.primaryCategory.slug as CategorySlug,
  authorSlug: row.author.slug,
  authorName: row.author.displayName,
  ogImageUrl: row.ogImageUrl,
});

const ensureTagIds = async (tagSlugs: string[]): Promise<string[]> => {
  if (tagSlugs.length === 0) return [];
  const existing = await db
    .select({ id: tags.id, slug: tags.slug })
    .from(tags)
    .where(inArray(tags.slug, tagSlugs));
  const existingBySlug = new Map(existing.map((t) => [t.slug, t.id]));
  const missing = tagSlugs.filter((s) => !existingBySlug.has(s));
  if (missing.length > 0) {
    const inserted = await db
      .insert(tags)
      .values(missing.map((slug) => ({ slug, name: slug })))
      .returning({ id: tags.id, slug: tags.slug });
    for (const row of inserted) existingBySlug.set(row.slug, row.id);
  }
  return tagSlugs.map((s) => existingBySlug.get(s)!).filter(Boolean);
};

const resolveCategoryId = async (slug: string): Promise<string> => {
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (!row) throw notFound(`Category(${slug})`);
  return row.id;
};

export const drizzleArticleRepository: ArticleRepository = {
  async findBySlug(slug) {
    // Korean slugs arrive from URLs in either NFC or NFD form depending on the
    // client OS/browser. We always store NFC, so normalize before matching.
    const normalized = slug.normalize("NFC");
    const row = await db.query.articles.findFirst({
      where: eq(articles.slug, normalized),
      with: {
        author: true,
        primaryCategory: true,
        medicalReviewer: true,
        tags: { with: { tag: true } },
      },
    });
    if (!row) return null;
    return mapArticle(row as ArticleWithRelations);
  },

  async listSummaries(
    filter: ArticleListFilter,
    pagination: Pagination,
  ): Promise<Paginated<ArticleSummary>> {
    const conditions = [] as ReturnType<typeof eq>[];
    if (filter.status === undefined || filter.status === "published") {
      conditions.push(eq(articles.status, "published"));
    } else if (filter.status !== "all") {
      conditions.push(eq(articles.status, filter.status));
    }
    if (filter.categorySlug) {
      const [cat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, filter.categorySlug))
        .limit(1);
      if (!cat) return { items: [], nextCursor: null };
      conditions.push(eq(articles.primaryCategoryId, cat.id));
    }
    if (filter.authorSlug) {
      const [au] = await db
        .select({ id: authors.id })
        .from(authors)
        .where(eq(authors.slug, filter.authorSlug))
        .limit(1);
      if (!au) return { items: [], nextCursor: null };
      conditions.push(eq(articles.authorId, au.id));
    }
    if (filter.tagSlug) {
      const [t] = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.slug, filter.tagSlug))
        .limit(1);
      if (!t) return { items: [], nextCursor: null };
      const articleIdsWithTag = db
        .select({ id: articleTags.articleId })
        .from(articleTags)
        .where(eq(articleTags.tagId, t.id));
      conditions.push(inArray(articles.id, articleIdsWithTag));
    }

    const offset = pagination.cursor ? Number(pagination.cursor) : 0;
    const rows = await db.query.articles.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { author: true, primaryCategory: true },
      orderBy: [desc(articles.publishedAt), desc(articles.createdAt)],
      limit: pagination.limit + 1,
      offset,
    });

    const items = rows
      .slice(0, pagination.limit)
      .map((r) =>
        mapSummary(
          r as ArticleRow & { author: AuthorRow; primaryCategory: CategoryRow },
        ),
      );
    const nextCursor =
      rows.length > pagination.limit ? String(offset + pagination.limit) : null;
    return { items, nextCursor };
  },

  async listAllPublishedForSitemap() {
    const rows = await db.query.articles.findMany({
      where: eq(articles.status, "published"),
      with: { primaryCategory: true },
      orderBy: [desc(articles.publishedAt)],
    });
    return rows.map((r) => ({
      slug: r.slug,
      updatedAt: r.updatedAt,
      primaryCategorySlug: (r as ArticleRow & { primaryCategory: CategoryRow })
        .primaryCategory.slug as CategorySlug,
    }));
  },

  async listAllPublishedFull(): Promise<Article[]> {
    const rows = await db.query.articles.findMany({
      where: eq(articles.status, "published"),
      with: {
        author: true,
        primaryCategory: true,
        medicalReviewer: true,
        tags: { with: { tag: true } },
      },
      orderBy: [desc(articles.publishedAt)],
    });
    return rows.map((row) => mapArticle(row as ArticleWithRelations));
  },

  async upsert(input: ArticleStorageInput): Promise<Article> {
    const primaryCategoryId = await resolveCategoryId(input.primaryCategorySlug);
    const tagIds = await ensureTagIds(input.tagSlugs);

    const valuesBase = {
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
      tldr: input.tldr,
      contentJson: input.contentJson,
      contentHtml: input.contentHtml,
      readingTimeSec: input.readingTimeSec,
      status: input.status,
      authorId: input.authorId,
      primaryCategoryId,
      medicalReviewerId: input.medicalReviewerId ?? null,
      ogImageUrl: input.ogImageUrl ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      canonicalUrl: input.canonicalUrl ?? null,
      // INSERT value: must NOT reference the target table's own column.
      // now() is a function call, which is valid in a VALUES clause.
      publishedAt: input.status === "published" ? sql`now()` : null,
      updatedAt: sql`now()`,
      searchText: buildArticleSearchBlob({
        title: input.title,
        excerpt: input.excerpt,
        tldr: input.tldr,
        contentText: input.contentHtml.replace(/<[^>]+>/g, " "),
      }),
    };

    const [upserted] = await db
      .insert(articles)
      .values(valuesBase)
      .onConflictDoUpdate({
        target: articles.slug,
        set: {
          title: valuesBase.title,
          excerpt: valuesBase.excerpt,
          tldr: valuesBase.tldr,
          contentJson: valuesBase.contentJson,
          contentHtml: valuesBase.contentHtml,
          readingTimeSec: valuesBase.readingTimeSec,
          status: valuesBase.status,
          authorId: valuesBase.authorId,
          primaryCategoryId: valuesBase.primaryCategoryId,
          medicalReviewerId: valuesBase.medicalReviewerId,
          ogImageUrl: valuesBase.ogImageUrl,
          seoTitle: valuesBase.seoTitle,
          seoDescription: valuesBase.seoDescription,
          canonicalUrl: valuesBase.canonicalUrl,
          // UPDATE SET: referencing the existing row's column is valid here.
          // Preserve the original publish time; only stamp it on first publish.
          publishedAt:
            input.status === "published"
              ? sql`coalesce(${articles.publishedAt}, now())`
              : null,
          updatedAt: valuesBase.updatedAt,
          searchText: valuesBase.searchText,
        },
      })
      .returning({ id: articles.id });

    // Sync tags. Neon HTTP doesn't support transactions, so we do best-effort
    // sequential ops. Tag join writes are idempotent given the m2m PK.
    await db.delete(articleTags).where(eq(articleTags.articleId, upserted.id));
    if (tagIds.length > 0) {
      await db
        .insert(articleTags)
        .values(tagIds.map((tagId) => ({ articleId: upserted.id, tagId })));
    }

    const saved = await db.query.articles.findFirst({
      where: eq(articles.id, upserted.id),
      with: {
        author: true,
        primaryCategory: true,
        medicalReviewer: true,
        tags: { with: { tag: true } },
      },
    });
    if (!saved) throw notFound(`Article(${upserted.id})`);
    return mapArticle(saved as ArticleWithRelations);
  },

  async delete(id) {
    await db.delete(articles).where(eq(articles.id, id));
  },
};
