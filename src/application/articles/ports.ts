import type { Paginated, Pagination } from "@/application/shared/pagination";
import type { Article, ArticleInput, ArticleSummary } from "./model";

export type ArticleListFilter = {
  categorySlug?: string;
  tagSlug?: string;
  authorSlug?: string;
  status?: "published" | "draft" | "archived" | "all";
  /**
   * Result ordering. Defaults to "latest" (publishedAt desc). "popular" orders
   * by view count desc, powering the 인기 콘텐츠 ranking page.
   */
  sort?: "latest" | "popular";
};

export type ArticleStorageInput = ArticleInput & {
  contentHtml: string;
  readingTimeSec: number;
};

export interface ArticleRepository {
  /** Next sequential number used for auto-generated numeric slugs. */
  nextSlugNumber(): Promise<number>;
  /**
   * Atomically increments the view tally for a published article. No-op when
   * the slug doesn't resolve to a published article. Best-effort: callers
   * treat failures as non-fatal so view tracking never breaks page delivery.
   */
  incrementViewCount(slug: string): Promise<void>;
  findBySlug(slug: string): Promise<Article | null>;
  findById(id: string): Promise<Article | null>;
  listSummaries(
    filter: ArticleListFilter,
    pagination: Pagination,
  ): Promise<Paginated<ArticleSummary>>;
  listAllPublishedForSitemap(): Promise<
    Pick<ArticleSummary, "slug" | "updatedAt" | "primaryCategorySlug">[]
  >;
  listAllPublishedFull(): Promise<Article[]>;
  upsert(input: ArticleStorageInput): Promise<Article>;
  delete(id: string): Promise<void>;
}

export interface HtmlRenderer {
  renderTiptapToHtml(json: unknown): Promise<{ html: string; readingTimeSec: number }>;
}

export interface RevalidationPort {
  revalidateArticle(slug: string, categorySlug: string): Promise<void>;
  revalidateCategory(categorySlug: string): Promise<void>;
  revalidateHome(): Promise<void>;
}
