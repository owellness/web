import type { Category, CategoryInput } from "./model";

export interface CategoryRepository {
  listAll(): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
  findById(id: string): Promise<Category | null>;
  upsertSeed(input: {
    slug: string;
    name: string;
    description: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
  }): Promise<Category>;
  create(input: CategoryInput): Promise<Category>;
  update(id: string, input: CategoryInput): Promise<Category>;
  delete(id: string): Promise<void>;
}
