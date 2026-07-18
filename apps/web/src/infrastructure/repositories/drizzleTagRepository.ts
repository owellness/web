import { eq } from "drizzle-orm";

import type { Tag } from "@/application/tags/model";
import type { TagRepository } from "@/application/tags/ports";
import { decodeSlugForLookup } from "@/application/shared/slug";

import { db } from "@/infrastructure/db/client";
import { tags } from "@/infrastructure/db/schema";

type Row = typeof tags.$inferSelect;
const map = (row: Row): Tag => ({ id: row.id, slug: row.slug, name: row.name });

export const drizzleTagRepository: TagRepository = {
  async findBySlug(slug) {
    const [row] = await db
      .select()
      .from(tags)
      .where(eq(tags.slug, decodeSlugForLookup(slug)))
      .limit(1);
    return row ? map(row) : null;
  },
  async listAll() {
    const rows = await db.select().from(tags).orderBy(tags.name);
    return rows.map(map);
  },
};
