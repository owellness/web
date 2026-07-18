import { z } from "zod";

import { isValidCode } from "@/application/owti";

// Anonymous funnel events emitted by the OWTI quiz. No per-question answers are
// recorded — only which stage a session reached and the final type code.
export const OWTI_EVENT_TYPES = ["start", "advance", "complete"] as const;
export type OwtiEventType = (typeof OWTI_EVENT_TYPES)[number];

export const owtiEventInputSchema = z
  .object({
    // Anonymous, client-generated random id (e.g. a UUID). No PII.
    sessionId: z.string().trim().min(8).max(40),
    type: z.enum(OWTI_EVENT_TYPES),
    // advance only: the 1-based domain step just completed (1–3).
    step: z.number().int().min(1).max(3).nullish(),
    // complete only: the resulting 4-letter type code.
    code: z.string().trim().nullish(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "advance" && val.step == null) {
      ctx.addIssue({
        code: "custom",
        path: ["step"],
        message: "step is required for advance events",
      });
    }
    if (val.type === "complete" && (!val.code || !isValidCode(val.code))) {
      ctx.addIssue({
        code: "custom",
        path: ["code"],
        message: "a valid 4-letter code is required for complete events",
      });
    }
  });

export type OwtiEventInput = z.infer<typeof owtiEventInputSchema>;

// ── Stats read models ────────────────────────────────────────────────────

export type OwtiStatsPeriod = "7d" | "30d" | "all";

export const OWTI_STATS_PERIODS: readonly {
  value: OwtiStatsPeriod;
  label: string;
}[] = [
  { value: "7d", label: "최근 7일" },
  { value: "30d", label: "최근 30일" },
  { value: "all", label: "전체 기간" },
];

export const parseStatsPeriod = (raw: string | undefined): OwtiStatsPeriod =>
  raw === "7d" || raw === "30d" || raw === "all" ? raw : "30d";

/** Distinct-session counts for each funnel stage (each stage ⊆ the previous). */
export type OwtiFunnel = {
  started: number; // opened the test
  step1: number; // finished step 1 (Action)
  step2: number; // finished step 2 (Fitness)
  step3: number; // finished step 3 (Calm)
  completed: number; // finished all 48 → got a result
};

export type OwtiTypeCount = { code: string; count: number };

export type OwtiStats = {
  funnel: OwtiFunnel;
  /** Completions grouped by 4-letter code, highest first. */
  typeCounts: OwtiTypeCount[];
  /** Total completions in range (sum of typeCounts). */
  totalCompletions: number;
};

/** Convert a period to an inclusive lower bound, or null for all-time. */
export const periodSince = (
  period: OwtiStatsPeriod,
  nowMs: number,
): Date | null => {
  if (period === "all") return null;
  const days = period === "7d" ? 7 : 30;
  return new Date(nowMs - days * 24 * 60 * 60 * 1000);
};
