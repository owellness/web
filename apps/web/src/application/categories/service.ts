import { CATEGORIES } from "@/config/site";

import {
  ApplicationError,
  notFound,
  validationFailed,
} from "@/application/shared/errors";
import { formatZodError } from "@/application/shared/validationMessage";
import { slugify } from "@/application/shared/slug";

import { categoryInputSchema, type Category } from "./model";
import type { CategoryRepository } from "./ports";

export const createCategoryService = (repo: CategoryRepository) => ({
  async listAll(): Promise<Category[]> {
    return repo.listAll();
  },

  async findBySlug(slug: string): Promise<Category | null> {
    return repo.findBySlug(slug);
  },

  async findById(id: string): Promise<Category | null> {
    return repo.findById(id);
  },

  async ensureSeeded(): Promise<void> {
    // Only seed when the DB has none yet — once the admin starts curating
    // categories, we don't want to keep re-adding the defaults.
    const existing = await repo.listAll();
    if (existing.length > 0) return;
    for (const cat of CATEGORIES) {
      await repo.upsertSeed({
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
      });
    }
  },

  async create(rawInput: unknown): Promise<Category> {
    const parsed = categoryInputSchema.safeParse({
      ...((rawInput ?? {}) as object),
      slug: slugify(((rawInput ?? {}) as { slug?: string }).slug ?? "") ||
        slugify(((rawInput ?? {}) as { name?: string }).name ?? ""),
    });
    if (!parsed.success) throw validationFailed(formatZodError(parsed.error));

    const existing = await repo.findBySlug(parsed.data.slug);
    if (existing) {
      throw new ApplicationError(
        "ALREADY_EXISTS",
        `이미 같은 슬러그(${parsed.data.slug})의 카테고리가 있습니다.`,
      );
    }
    return repo.create(parsed.data);
  },

  async update(id: string, rawInput: unknown): Promise<Category> {
    const parsed = categoryInputSchema.safeParse({
      ...((rawInput ?? {}) as object),
      slug:
        slugify(((rawInput ?? {}) as { slug?: string }).slug ?? "") ||
        slugify(((rawInput ?? {}) as { name?: string }).name ?? ""),
    });
    if (!parsed.success) throw validationFailed(formatZodError(parsed.error));

    const existing = await repo.findBySlug(parsed.data.slug);
    if (existing && existing.id !== id) {
      throw new ApplicationError(
        "ALREADY_EXISTS",
        `다른 카테고리가 이미 슬러그 '${parsed.data.slug}'를 쓰고 있습니다.`,
      );
    }

    const current = await repo.findById(id);
    if (!current) throw notFound("Category");
    return repo.update(id, parsed.data);
  },

  async delete(id: string): Promise<void> {
    const current = await repo.findById(id);
    if (!current) throw notFound("Category");
    await repo.delete(id);
  },
});

export type CategoryService = ReturnType<typeof createCategoryService>;
