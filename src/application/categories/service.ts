import { CATEGORIES } from "@/config/site";
import type { Category } from "./model";
import type { CategoryRepository } from "./ports";

export const createCategoryService = (repo: CategoryRepository) => ({
  async listAll(): Promise<Category[]> {
    return repo.listAll();
  },

  async findBySlug(slug: string): Promise<Category | null> {
    return repo.findBySlug(slug);
  },

  async ensureSeeded(): Promise<void> {
    for (const cat of CATEGORIES) {
      await repo.upsertSeed({
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
      });
    }
  },
});

export type CategoryService = ReturnType<typeof createCategoryService>;
