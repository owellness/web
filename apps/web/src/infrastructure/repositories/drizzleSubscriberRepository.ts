import { count, desc, eq, sql } from "drizzle-orm";

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

  async listRecent(limit) {
    const rows = await db
      .select()
      .from(newsletterSubscribers)
      .orderBy(desc(newsletterSubscribers.createdAt))
      .limit(limit);
    return rows.map(map);
  },

  async listConfirmedEmails() {
    const rows = await db
      .select({ email: newsletterSubscribers.email })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, "confirmed"))
      .orderBy(desc(newsletterSubscribers.createdAt));
    return rows.map((r) => r.email);
  },

  async countByStatus() {
    const rows = await db
      .select({
        status: newsletterSubscribers.status,
        n: count(),
      })
      .from(newsletterSubscribers)
      .groupBy(newsletterSubscribers.status);
    const out: Record<Subscriber["status"], number> = {
      pending: 0,
      confirmed: 0,
      unsubscribed: 0,
    };
    for (const r of rows) out[r.status] = Number(r.n);
    return out;
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
          // The CASE arms are bare string literals, so Postgres resolves the
          // expression to `text`; assigning text to the enum column fails with
          // "column \"status\" is of type subscriber_status but expression is
          // of type text". Cast the result back to the enum type explicitly.
          status: sql`(case when ${newsletterSubscribers.status} = 'confirmed' then 'confirmed' else 'pending' end)::"subscriber_status"`,
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
