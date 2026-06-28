import {
  BORDERLINE_MAX,
  BORDERLINE_MIN,
  DOMAINS_IN_ORDER,
  type DomainKey,
  QUESTIONS_PER_DOMAIN,
  SCALE_MAX,
  SCALE_MIN,
  STRONG_THRESHOLD,
  type WellnessDomain,
} from "./model";
import { QUESTIONS } from "./questions";
import { type OwtiType, TYPE_BY_CODE } from "./types";

/** A map of question id (1–48) → Likert answer (1–5). */
export type Answers = Readonly<Record<number, number>>;

export type DomainScore = {
  domain: WellnessDomain;
  /** Mean of the domain's 12 answers, 1–5. */
  average: number;
  /** average ≥ STRONG_THRESHOLD. */
  isStrong: boolean;
  /** average within [BORDERLINE_MIN, BORDERLINE_MAX] — a "growth zone". */
  isBorderline: boolean;
  /** The resolved single-letter code for this domain (e.g. "A" or "P"). */
  letter: string;
};

export type OwtiResult = {
  code: string;
  type: OwtiType;
  /** Domain scores in code order (Action → Fitness → Calm → Heart). */
  scores: DomainScore[];
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/** Average of a domain's 12 answers. Missing answers count as 0 (incomplete). */
export const domainAverage = (domain: DomainKey, answers: Answers): number => {
  const ids = QUESTIONS.filter((q) => q.domain === domain).map((q) => q.id);
  const sum = ids.reduce((acc, id) => acc + (answers[id] ?? 0), 0);
  return sum / QUESTIONS_PER_DOMAIN;
};

export const scoreDomain = (
  domain: WellnessDomain,
  answers: Answers,
): DomainScore => {
  const average = domainAverage(domain.key, answers);
  const isStrong = average >= STRONG_THRESHOLD;
  return {
    domain,
    average,
    isStrong,
    isBorderline: average >= BORDERLINE_MIN && average <= BORDERLINE_MAX,
    letter: isStrong ? domain.strong.letter : domain.weak.letter,
  };
};

/** True once every one of the 48 questions has a valid 1–5 answer. */
export const isComplete = (answers: Answers): boolean =>
  QUESTIONS.every((q) => {
    const v = answers[q.id];
    return typeof v === "number" && v >= SCALE_MIN && v <= SCALE_MAX;
  });

/**
 * Score a full set of answers into a 4-letter code, the matching type, and the
 * per-domain breakdown. Pure — safe to call from the browser.
 */
export const computeResult = (answers: Answers): OwtiResult => {
  const scores = DOMAINS_IN_ORDER.map((d) => scoreDomain(d, answers));
  const code = scores.map((s) => s.letter).join("");
  const type = TYPE_BY_CODE[code];
  if (!type) {
    // Should never happen: every A/P·F/W·C/T·H/E combination is catalogued.
    throw new Error(`Unknown OWTI code: ${code}`);
  }
  return { code, type, scores };
};

/**
 * Build per-domain scores from four pre-computed averages (in code order).
 * Used by the result page to reconstruct the breakdown from the URL hash
 * without re-running the quiz.
 */
export const scoresFromAverages = (averages: number[]): DomainScore[] =>
  DOMAINS_IN_ORDER.map((domain, i) => {
    const average = clamp(averages[i] ?? 0, 0, SCALE_MAX);
    const isStrong = average >= STRONG_THRESHOLD;
    return {
      domain,
      average,
      isStrong,
      isBorderline: average >= BORDERLINE_MIN && average <= BORDERLINE_MAX,
      letter: isStrong ? domain.strong.letter : domain.weak.letter,
    };
  });

// ── URL-hash encoding ────────────────────────────────────────────────────
// Personal scores travel in the result URL's hash (e.g. #4.25-3.83-3.17-4.50)
// so the result page itself stays fully static & cacheable: the hash is never
// sent to the server.

export const encodeAverages = (scores: DomainScore[]): string =>
  scores.map((s) => s.average.toFixed(2)).join("-");

/** Parse the hash back into 4 averages, or null if malformed. */
export const decodeAverages = (raw: string): number[] | null => {
  const cleaned = raw.replace(/^#/, "").trim();
  if (!cleaned) return null;
  const parts = cleaned.split("-");
  if (parts.length !== DOMAINS_IN_ORDER.length) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isFinite(n) || n < 0 || n > SCALE_MAX)) {
    return null;
  }
  return nums;
};

/** The domain a person should focus on first: the weakest (lowest average). */
export const weakestDomain = (scores: DomainScore[]): DomainScore =>
  scores.reduce((min, s) => (s.average < min.average ? s : min), scores[0]);

// ── Code → domain composition ────────────────────────────────────────────
// Lets the (static) result page show which domains a code marks strong/weak
// without needing the personal averages from the hash.

export type DomainPoleResult = {
  domain: WellnessDomain;
  isStrong: boolean;
  letter: string;
};

export const parseCode = (code: string): DomainPoleResult[] =>
  DOMAINS_IN_ORDER.map((domain, i) => {
    const letter = code[i] ?? "";
    return { domain, isStrong: letter === domain.strong.letter, letter };
  });

/** The weak (○) domains for a code, in code order. */
export const weakDomainsFromCode = (code: string): WellnessDomain[] =>
  parseCode(code)
    .filter((p) => !p.isStrong)
    .map((p) => p.domain);
