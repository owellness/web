import { asc, eq } from "drizzle-orm";

import type { Category } from "@/application/categories/model";
import type { CategoryRepository } from "@/application/categories/ports";
import { decodeSlugForLookup } from "@/application/shared/slug";

import { db } from "@/infrastructure/db/client";
import { categories } from "@/infrastructure/db/schema";

type Row = typeof categories.$inferSelect;

const mapCategory = (row: Row): Category => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  seoTitle: row.seoTitle,
  seoDescription: row.seoDescription,
});

export const drizzleCategoryRepository: CategoryRepository = {
  async listAll(): Promise<Category[]> {
    const rows = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.position), asc(categories.name));
    return rows.map(mapCategory);
  },

  async findBySlug(slug) {
    const [row] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, decodeSlugForLookup(slug)))
      .limit(1);
    return row ? mapCategory(row) : null;
  },

  async findById(id) {
    const [row] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return row ? mapCategory(row) : null;
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
    return mapCategory(row);
  },

  async create(input) {
    const [row] = await db
      .insert(categories)
      .values({
        slug: input.slug,
        name: input.name,
        description: input.description,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
      })
      .returning();
    return mapCategory(row);
  },

  async update(id, input) {
    const [row] = await db
      .update(categories)
      .set({
        slug: input.slug,
        name: input.name,
        description: input.description,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
      })
      .where(eq(categories.id, id))
      .returning();
    if (!row) throw new Error(`Category(${id}) not found`);
    return mapCategory(row);
  },

  async delete(id) {
    await db.delete(categories).where(eq(categories.id, id));
  },
};
