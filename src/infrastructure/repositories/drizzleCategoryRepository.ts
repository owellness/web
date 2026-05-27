import { eq } from "drizzle-orm";

import type { Category } from "@/application/categories/model";
import type { CategoryRepository } from "@/application/categories/ports";
import { CATEGORIES, type CategorySlug } from "@/config/site";

import { db } from "@/infrastructure/db/client";
import { categories } from "@/infrastructure/db/schema";

const VALID_SLUGS = new Set(CATEGORIES.map((c) => c.slug));

const mapCategory = (row: typeof categories.$inferSelect): Category | null => {
  if (!VALID_SLUGS.has(row.slug as CategorySlug)) return null;
  return {
    id: row.id,
    slug: row.slug as CategorySlug,
    name: row.name,
    description: row.description,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
  };
};

export const drizzleCategoryRepository: CategoryRepository = {
  async listAll(): Promise<Category[]> {
    const rows = await db.select().from(categories);
    return rows.map(mapCategory).filter((c): c is Category => c !== null);
  },

  async findBySlug(slug: string): Promise<Category | null> {
    const [row] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    if (!row) return null;
    return mapCategory(row);
  },

  async upsertSeed(input) {
    const [row] = await db
      .insert(categories)
      .values({
        slug: input.slug,
        name: input.name,
        description: input.description,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
      })
      .onConflictDoUpdate({
        target: categories.slug,
        set: {
          name: input.name,
          description: input.description,
        },
      })
      .returning();
    const mapped = mapCategory(row);
    if (!mapped) throw new Error(`Invalid category slug: ${input.slug}`);
    return mapped;
  },
};
