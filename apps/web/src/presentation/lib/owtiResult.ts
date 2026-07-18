// Resolve the four domain averages for a result page, client-side only.
// Tries, in order:
//  1. the URL hash (works for shared/bookmarked links on a full page load), and
//  2. sessionStorage written by the quiz on finish — reliable right after the
//     quiz, because a client-side router.push() may not have applied the hash
//     by the time the result page first reads it.
// The stored value is keyed by code so one person's result never shows up on a
// different type's shared page.

import { decodeAverages, RESULT_STORAGE_KEY } from "@/application/owti";

export function readResultAverages(code: string): number[] | null {
  if (typeof window === "undefined") return null;

  const fromHash = decodeAverages(window.location.hash);
  if (fromHash) return fromHash;

  try {
    const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { code?: string; averages?: string };
      if (parsed?.code === code && typeof parsed.averages === "string") {
        return decodeAverages(parsed.averages);
      }
    }
  } catch {
    /* ignore unavailable/corrupt storage */
  }
  return null;
}
