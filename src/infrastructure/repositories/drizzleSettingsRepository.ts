import { eq, sql } from "drizzle-orm";

import type { SiteSettings } from "@/application/settings/model";
import type { SettingsRepository } from "@/application/settings/ports";

import { db } from "@/infrastructure/db/client";
import { siteSettings } from "@/infrastructure/db/schema";

const SINGLETON_ID = "default";

type Row = typeof siteSettings.$inferSelect;

const map = (row: Row): SiteSettings => ({
  heroEyebrow: row.heroEyebrow,
  heroTitle: row.heroTitle,
  heroSubtitle: row.heroSubtitle,
  faviconUrl: row.faviconUrl,
});

export const drizzleSettingsRepository: SettingsRepository = {
  async get() {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, SINGLETON_ID))
      .limit(1);
    return row ? map(row) : null;
  },

  async upsert(input) {
    const [row] = await db
      .insert(siteSettings)
      .values({
        id: SINGLETON_ID,
        heroEyebrow: input.heroEyebrow,
        heroTitle: input.heroTitle,
        heroSubtitle: input.heroSubtitle,
        faviconUrl: input.faviconUrl,
        updatedAt: sql`now()`,
      })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: {
          heroEyebrow: input.heroEyebrow,
          heroTitle: input.heroTitle,
          heroSubtitle: input.heroSubtitle,
          faviconUrl: input.faviconUrl,
          updatedAt: sql`now()`,
        },
      })
      .returning();
    return map(row);
  },
};
