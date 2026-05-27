import type { ArticleSummary } from "@/application/articles/model";
import type { SearchPort } from "./ports";

const MAX_QUERY = 80;

export const createSearchService = (port: SearchPort) => ({
  async search(query: string, limit = 30): Promise<ArticleSummary[]> {
    const cleaned = query.trim().slice(0, MAX_QUERY);
    if (cleaned.length === 0) return [];
    return port.searchArticles(cleaned, limit);
  },
});

export type SearchService = ReturnType<typeof createSearchService>;
