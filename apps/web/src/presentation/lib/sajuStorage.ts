import {
  isSajuWellnessResult,
  SAJU_RESULT_STORAGE_KEY,
  type SajuWellnessResult,
} from "@/application/saju";

export function saveSajuResult(result: SajuWellnessResult): boolean {
  if (typeof window === "undefined") return false;
  try {
    sessionStorage.setItem(SAJU_RESULT_STORAGE_KEY, JSON.stringify(result));
    return true;
  } catch {
    return false;
  }
}

export function readSajuResult(): SajuWellnessResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SAJU_RESULT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSajuWellnessResult(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
