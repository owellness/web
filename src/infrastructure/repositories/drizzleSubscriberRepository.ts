import { eq, sql } from "drizzle-orm";

import type { Subscriber } from "@/application/newsletter/model";
import type { SubscriberRepository } from "@/application/newsletter/ports";

import { db } from "@/infrastructure/db/client";
import { newsletterSubscribers } from "@/infrastructure/db/schema";

type Row = typeof newsletterSubscribers.$inferSelect;

const map = (row: Row): Subscriber => ({
  id: row.id,
  email: row.email,
  status: row.status,
  source: row.source,
  consentedAt: row.consentedAt,
  confirmedAt: row.confirmedAt,
  unsubscribedAt: row.unsubscribedAt,
  createdAt: row.createdAt,
});

export const drizzleSubscriberRepository: SubscriberRepository = {
  async findByEmail(email) {
    const [row] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email.toLowerCase()))
      .limit(1);
    return row ? map(row) : null;
  },

  async upsertPending(input) {
    const [row] = await db
      .insert(newsletterSubscribers)
      .values({
        email: input.email.toLowerCase(),
        source: input.source,
        consentedAt: input.consentedAt,
        status: "pending",
      })
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: {
          source: input.source,
          consentedAt: input.consentedAt,
          status: sql`case when ${newsletterSubscribers.status} = 'confirmed' then 'confirmed' else 'pending' end`,
        },
      })
      .returning();
    return map(row);
  },

  async markConfirmed(email, at) {
    const [row] = await db
      .update(newsletterSubscribers)
      .set({ status: "confirmed", confirmedAt: at })
      .where(eq(newsletterSubscribers.email, email.toLowerCase()))
      .returning();
    return row ? map(row) : null;
  },

  async markUnsubscribed(email, at) {
    const [row] = await db
      .update(newsletterSubscribers)
      .set({ status: "unsubscribed", unsubscribedAt: at })
      .where(eq(newsletterSubscribers.email, email.toLowerCase()))
      .returning();
    return row ? map(row) : null;
  },
};
