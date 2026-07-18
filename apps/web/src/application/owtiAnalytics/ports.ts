import type { OwtiEventInput, OwtiFunnel, OwtiTypeCount } from "./model";

export interface OwtiEventRepository {
  /** Append a single funnel event. */
  record(input: OwtiEventInput): Promise<void>;
  /** Distinct-session counts per funnel stage. `since=null` means all time. */
  funnel(since: Date | null): Promise<OwtiFunnel>;
  /** Completion counts grouped by 4-letter code, highest first. */
  typeCounts(since: Date | null): Promise<OwtiTypeCount[]>;
}
