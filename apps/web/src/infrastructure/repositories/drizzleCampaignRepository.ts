import { desc, eq } from "drizzle-orm";

import type { Campaign, TiptapDocument } from "@/application/newsletter/model";
import type { CampaignRepository } from "@/application/newsletter/ports";

import { db } from "@/infrastructure/db/client";
import { newsletterCampaigns } from "@/infrastructure/db/schema";

type Row = typeof newsletterCampaigns.$inferSelect;

const map = (row: Row): Campaign => ({
  id: row.id,
  subject: row.subject,
  contentJson: row.contentJson as TiptapDocument,
  contentHtml: row.contentHtml,
  status: row.status,
  recipientCount: row.recipientCount,
  sentCount: row.sentCount,
  error: row.error,
  sentAt: row.sentAt,
  createdAt: row.createdAt,
});

export const drizzleCampaignRepository: CampaignRepository = {
  async create(input) {
    const [row] = await db
      .insert(newsletterCampaigns)
      .values({
        subject: input.subject,
        contentJson: input.contentJson,
        contentHtml: input.contentHtml,
        status: input.status,
        recipientCount: input.recipientCount,
        createdById: input.createdById,
      })
      .returning();
    return map(row);
  },

  async finalize(id, update) {
    await db
      .update(newsletterCampaigns)
      .set({
        status: update.status,
        sentCount: update.sentCount,
        error: update.error,
        sentAt: update.sentAt,
      })
      .where(eq(newsletterCampaigns.id, id));
  },

  async listRecent(limit) {
    const rows = await db
      .select()
      .from(newsletterCampaigns)
      .orderBy(desc(newsletterCampaigns.createdAt))
      .limit(limit);
    return rows.map(map);
  },
};
