import { eq, sql } from "drizzle-orm";

import type { Author } from "@/application/authors/model";
import type { AuthorRepository } from "@/application/authors/ports";

import { db } from "@/infrastructure/db/client";
import { authors } from "@/infrastructure/db/schema";

type AuthorRow = typeof authors.$inferSelect;

const mapAuthor = (row: AuthorRow): Author => ({
  id: row.id,
  userId: row.userId,
  slug: row.slug,
  displayName: row.displayName,
  bio: row.bio,
  avatarUrl: row.avatarUrl,
  credentials: row.credentials,
  affiliation: row.affiliation,
  websiteUrl: row.websiteUrl,
  social: row.socialJson,
});

const findUniqueSlug = async (base: string): Promise<string> => {
  let attempt = base;
  let suffix = 0;
  while (true) {
    const [existing] = await db
      .select({ id: authors.id })
      .from(authors)
      .where(eq(authors.slug, attempt))
      .limit(1);
    if (!existing) return attempt;
    suffix += 1;
    attempt = `${base}-${suffix}`;
    if (suffix > 50) {
      attempt = `${base}-${Date.now().toString(36)}`;
      return attempt;
    }
  }
};

export const drizzleAuthorRepository: AuthorRepository = {
  async findById(id) {
    const [row] = await db
      .select()
      .from(authors)
      .where(eq(authors.id, id))
      .limit(1);
    return row ? mapAuthor(row) : null;
  },

  async findBySlug(slug) {
    const [row] = await db
      .select()
      .from(authors)
      .where(eq(authors.slug, slug))
      .limit(1);
    return row ? mapAuthor(row) : null;
  },

  async findByUserId(userId) {
    const [row] = await db
      .select()
      .from(authors)
      .where(eq(authors.userId, userId))
      .limit(1);
    return row ? mapAuthor(row) : null;
  },

  async create(input) {
    const slug = await findUniqueSlug(input.slug || "author");
    const [row] = await db
      .insert(authors)
      .values({
        userId: input.userId,
        slug,
        displayName: input.displayName,
        bio: input.bio ?? "",
        socialJson: {},
        updatedAt: sql`now()`,
      })
      .returning();
    return mapAuthor(row);
  },
};
