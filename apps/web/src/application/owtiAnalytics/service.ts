import { validationFailed } from "@/application/shared/errors";
import { formatZodError } from "@/application/shared/validationMessage";

import {
  owtiEventInputSchema,
  type OwtiStats,
  type OwtiStatsPeriod,
  periodSince,
} from "./model";
import type { OwtiEventRepository } from "./ports";

export const createOwtiAnalyticsService = (repo: OwtiEventRepository) => ({
  /**
   * Record a funnel event. Best-effort: validation errors throw (the route
   * handler turns them into a 4xx), but callers generally fire-and-forget.
   */
  async record(rawInput: unknown): Promise<void> {
    const parsed = owtiEventInputSchema.safeParse(rawInput);
    if (!parsed.success) throw validationFailed(formatZodError(parsed.error));
    await repo.record(parsed.data);
  },

  /** Funnel + type distribution for the given period. */
  async stats(period: OwtiStatsPeriod): Promise<OwtiStats> {
    const since = periodSince(period, Date.now());
    const [funnel, typeCounts] = await Promise.all([
      repo.funnel(since),
      repo.typeCounts(since),
    ]);
    const totalCompletions = typeCounts.reduce((sum, t) => sum + t.count, 0);
    return { funnel, typeCounts, totalCompletions };
  },
});

export type OwtiAnalyticsService = ReturnType<
  typeof createOwtiAnalyticsService
>;
