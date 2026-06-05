import { asc, eq } from "drizzle-orm";

import type { TiptapDocument } from "@/application/articles/model";
import type { SitePage } from "@/application/pages/model";
import type { SitePageRepository, SitePageUpsert } from "@/application/pages/ports";
import { decodeSlugForLookup } from "@/application/shared/slug";

import { db } from "@/infrastructure/db/client";
import { sitePages } from "@/infrastructure/db/schema";

type Row = typeof sitePages.$inferSelect;

const mapPage = (row: Row): SitePage => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  bodyHtml: row.bodyHtml,
  bodyJson: (row.bodyJson ?? { type: "doc", content: [] }) as TiptapDocument,
  seoTitle: row.seoTitle,
  seoDescription: row.seoDescription,
  updatedAt: row.updatedAt,
});

export const drizzlePageRepository: SitePageRepository = {
  async listAll(): Promise<SitePage[]> {
    const rows = await db.select().from(sitePages).orderBy(asc(sitePages.createdAt));
    return rows.map(mapPage);
  },

  async findBySlug(slug) {
    const [row] = await db
      .select()
      .from(sitePages)
      .where(eq(sitePages.slug, decodeSlugForLookup(slug)))
      .limit(1);
    return row ? mapPage(row) : null;
  },

  async upsert(input: SitePageUpsert) {
    const [row] = await db
      .insert(sitePages)
      .values({
        slug: input.slug,
        title: input.title,
        bodyHtml: input.bodyHtml,
        bodyJson: input.bodyJson,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
      })
      .onConflictDoUpdate({
        target: sitePages.slug,
        set: {
          title: input.title,
          bodyHtml: input.bodyHtml,
          bodyJson: input.bodyJson,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          updatedAt: new Date(),
        },
      })
      .returning();
    return mapPage(row);
  },
};
