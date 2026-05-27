import type { Category } from "./model";

export interface CategoryRepository {
  listAll(): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
  upsertSeed(input: {
    slug: string;
    name: string;
    description: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
  }): Promise<Category>;
}
