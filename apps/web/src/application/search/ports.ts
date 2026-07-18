import type { ArticleSummary } from "@/application/articles/model";

export interface SearchPort {
  searchArticles(query: string, limit: number): Promise<ArticleSummary[]>;
}
