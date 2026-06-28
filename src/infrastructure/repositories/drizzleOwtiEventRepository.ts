import { and, count, desc, eq, gte, isNotNull, sql } from "drizzle-orm";

import type {
  OwtiEventInput,
  OwtiFunnel,
  OwtiTypeCount,
} from "@/application/owtiAnalytics/model";
import type { OwtiEventRepository } from "@/application/owtiAnalytics/ports";

import { db } from "@/infrastructure/db/client";
import { owtiEvents } from "@/infrastructure/db/schema";

// Postgres returns bigint counts as strings over the Neon HTTP driver.
const num = (v: unknown): number => Number(v ?? 0);

export const drizzleOwtiEventRepository: OwtiEventRepository = {
  async record(input: OwtiEventInput): Promise<void> {
    await db.insert(owtiEvents).values({
      sessionId: input.sessionId,
      type: input.type,
      step: input.type === "advance" ? (input.step ?? null) : null,
      code: input.type === "complete" ? (input.code ?? null) : null,
    });
  },

  async funnel(since: Date | null): Promise<OwtiFunnel> {
    // One pass with conditional distinct-session counts per stage. Each stage
    // is a subset of the previous (a completer also emitted the advance events).
    const [row] = await db
      .select({
        started: sql<string>`count(distinct ${owtiEvents.sessionId}) filter (where ${owtiEvents.type} = 'start')`,
        step1: sql<string>`count(distinct ${owtiEvents.sessionId}) filter (where ${owtiEvents.type} = 'advance' and ${owtiEvents.step} >= 1)`,
        step2: sql<string>`count(distinct ${owtiEvents.sessionId}) filter (where ${owtiEvents.type} = 'advance' and ${owtiEvents.step} >= 2)`,
        step3: sql<string>`count(distinct ${owtiEvents.sessionId}) filter (where ${owtiEvents.type} = 'advance' and ${owtiEvents.step} >= 3)`,
        completed: sql<string>`count(distinct ${owtiEvents.sessionId}) filter (where ${owtiEvents.type} = 'complete')`,
      })
      .from(owtiEvents)
      .where(since ? gte(owtiEvents.createdAt, since) : undefined);

    return {
      started: num(row?.started),
      step1: num(row?.step1),
      step2: num(row?.step2),
      step3: num(row?.step3),
      completed: num(row?.completed),
    };
  },

  async typeCounts(since: Date | null): Promise<OwtiTypeCount[]> {
    const filters = [eq(owtiEvents.type, "complete"), isNotNull(owtiEvents.code)];
    if (since) filters.push(gte(owtiEvents.createdAt, since));

    const rows = await db
      .select({ code: owtiEvents.code, value: count() })
      .from(owtiEvents)
      .where(and(...filters))
      .groupBy(owtiEvents.code)
      .orderBy(desc(count()));

    return rows
      .filter((r): r is { code: string; value: number } => Boolean(r.code))
      .map((r) => ({ code: r.code, count: num(r.value) }));
  },
};
