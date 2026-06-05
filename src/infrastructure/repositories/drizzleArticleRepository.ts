import { and, desc, eq, inArray, or, sql } from "drizzle-orm";

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
import { decodeSlugForLookup } from "@/application/shared/slug";
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

// Loads an article's relations with explicit queries rather than a single
// nested relational query. The relational form joined `authors` twice
// (author + medicalReviewer) plus the tags m2m, which proved fragile over
// neon-http; splitting it keeps detail lookups reliable.
const loadArticleWithRelations = async (
  row: ArticleRow,
): Promise<Article | null> => {
  const [author] = await db
    .select()
    .from(authors)
    .where(eq(authors.id, row.authorId))
    .limit(1);
  const [primaryCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, row.primaryCategoryId))
    .limit(1);
  if (!author || !primaryCategory) return null;

  let medicalReviewer: AuthorRow | null = null;
  if (row.medicalReviewerId) {
    const [mr] = await db
      .select()
      .from(authors)
      .where(eq(authors.id, row.medicalReviewerId))
      .limit(1);
    medicalReviewer = mr ?? null;
  }

  const tagRows = await db
    .select({ tag: tags })
    .from(articleTags)
    .innerJoin(tags, eq(articleTags.tagId, tags.id))
    .where(eq(articleTags.articleId, row.id));

  return mapArticle({ ...row, author, primaryCategory, medicalReviewer, tags: tagRows });
};

export const drizzleArticleRepository: ArticleRepository = {
  async nextSlugNumber() {
    // Uses a Postgres sequence so numeric slugs are unique without races.
    // Falls back to a timestamp if the sequence isn't present yet (migration
    // not applied), keeping saves working.
    try {
      const res = await db.execute<{ n: string | number }>(
        sql`select nextval('article_slug_seq') as n`,
      );
      const n = Number(res.rows?.[0]?.n);
      if (Number.isFinite(n) && n > 0) return Math.trunc(n);
    } catch (e) {
      console.warn("[nextSlugNumber] sequence unavailable, using timestamp:", e);
    }
    return Date.now();
  },

  async findBySlug(slug) {
    // URL params may arrive percent-encoded and/or in NFD form. Decode +
    // NFC-normalize, then match both NFC and NFD against the stored value.
    const decoded = decodeSlugForLookup(slug);
    const nfc = decoded.normalize("NFC");
    const nfd = decoded.normalize("NFD");
    const [row] = await db
      .select()
      .from(articles)
      .where(
        nfc === nfd
          ? eq(articles.slug, nfc)
          : or(eq(articles.slug, nfc), eq(articles.slug, nfd)),
      )
      .limit(1);
    if (!row) return null;
    return loadArticleWithRelations(row);
  },

  async findById(id) {
    const [row] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);
    if (!row) return null;
    return loadArticleWithRelations(row);
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
    const rows = await db
      .select()
      .from(articles)
      .where(eq(articles.status, "published"))
      .orderBy(desc(articles.publishedAt));
    const loaded = await Promise.all(
      rows.map((row) => loadArticleWithRelations(row)),
    );
    return loaded.filter((a): a is Article => a !== null);
  },

  async upsert(input: ArticleStorageInput): Promise<Article> {
    const primaryCategoryId = await resolveCategoryId(input.primaryCategorySlug);
    const tagIds = await ensureTagIds(input.tagSlugs);

    const writable = {
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
      updatedAt: sql`now()`,
      searchText: buildArticleSearchBlob({
        title: input.title,
        excerpt: input.excerpt,
        tldr: input.tldr,
        contentText: input.contentHtml.replace(/<[^>]+>/g, " "),
      }),
    };

    let savedId: string;

    if (input.id) {
      // Editing an existing article: UPDATE by id so a slug change rewrites
      // the same row instead of inserting a new one. Preserve the original
      // publishedAt on republish.
      const [updated] = await db
        .update(articles)
        .set({
          ...writable,
          publishedAt:
            input.status === "published"
              ? sql`coalesce(${articles.publishedAt}, now())`
              : null,
        })
        .where(eq(articles.id, input.id))
        .returning({ id: articles.id });
      if (!updated) throw notFound(`Article(${input.id})`);
      savedId = updated.id;
    } else {
      // Creating a new article. Keep slug-conflict resolution so re-submitting
      // a draft with the same slug doesn't error out.
      const [inserted] = await db
        .insert(articles)
        .values({
          ...writable,
          // INSERT VALUES cannot reference the target table's own column.
          publishedAt: input.status === "published" ? sql`now()` : null,
        })
        .onConflictDoUpdate({
          target: articles.slug,
          set: {
            ...writable,
            publishedAt:
              input.status === "published"
                ? sql`coalesce(${articles.publishedAt}, now())`
                : null,
          },
        })
        .returning({ id: articles.id });
      savedId = inserted.id;
    }

    // Sync tags. Neon HTTP doesn't support transactions, so we do best-effort
    // sequential ops. Tag join writes are idempotent given the m2m PK.
    await db.delete(articleTags).where(eq(articleTags.articleId, savedId));
    if (tagIds.length > 0) {
      await db
        .insert(articleTags)
        .values(tagIds.map((tagId) => ({ articleId: savedId, tagId })));
    }

    const [savedRow] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, savedId))
      .limit(1);
    if (!savedRow) throw notFound(`Article(${savedId})`);
    const article = await loadArticleWithRelations(savedRow);
    if (!article) throw notFound(`Article(${savedId})`);
    return article;
  },

  async delete(id) {
    await db.delete(articles).where(eq(articles.id, id));
  },
};
