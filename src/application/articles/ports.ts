import type { Paginated, Pagination } from "@/application/shared/pagination";
import type { Article, ArticleInput, ArticleSummary } from "./model";

export type ArticleListFilter = {
  categorySlug?: string;
  tagSlug?: string;
  authorSlug?: string;
  status?: "published" | "draft" | "archived" | "all";
};

export type ArticleStorageInput = ArticleInput & {
  contentHtml: string;
  readingTimeSec: number;
};

export interface ArticleRepository {
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
