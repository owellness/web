// O! Wellness Type Indicator (OWTI) — core domain model.
//
// OWTI sorts wellness into four domains (Action · Fitness · Calm · Heart) and
// expresses a person's current strengths/weaknesses as a 4-letter code. Unlike
// a personality test it measures *present* lifestyle behaviour, so a type can
// change after a few months of focused practice.
//
// Everything in this folder is static data + pure functions — no DB, no I/O —
// so the quiz can be scored entirely in the browser.

export type DomainKey = "action" | "fitness" | "calm" | "heart";

/** 5-point Likert scale used by every question. */
export const SCALE_MIN = 1;
export const SCALE_MAX = 5;

/** Each domain is measured by exactly 12 questions. */
export const QUESTIONS_PER_DOMAIN = 12;
export const TOTAL_QUESTIONS = 48;

/**
 * Domain average ≥ 3.5 → strong code, otherwise → weak code.
 * (The source material phrases it as "3.5 이상 → 강점 / 3.4 이하 → 취약"; 3.5 is
 * the clean cut-off on the 1–5 scale.)
 */
export const STRONG_THRESHOLD = 3.5;

/**
 * Averages inside this band are "growth zones" — either code is plausible and a
 * re-test in ~3 months is recommended.
 */
export const BORDERLINE_MIN = 3.4;
export const BORDERLINE_MAX = 3.6;

export const LIKERT_OPTIONS = [
  { value: 1, label: "전혀 아니다", short: "전혀" },
  { value: 2, label: "아니다", short: "아니다" },
  { value: 3, label: "보통이다", short: "보통" },
  { value: 4, label: "그렇다", short: "그렇다" },
  { value: 5, label: "매우 그렇다", short: "매우" },
] as const;

export type DomainPole = {
  /** Single-letter code for this pole, e.g. "A" or "P". */
  letter: string;
  /** English short name, e.g. "Active" / "Passive". */
  name: string;
};

export type WellnessDomain = {
  key: DomainKey;
  /** 1-indexed position of this domain's letter in the 4-letter code. */
  position: 1 | 2 | 3 | 4;
  /** Korean domain name, e.g. "실천의 힘". */
  name: string;
  /** English domain name, e.g. "Action". */
  english: string;
  /** Short "도전 · 탐구 · 목표" style summary of the sub-facets. */
  summary: string;
  /** One-line explanation of what the domain measures. */
  description: string;
  /** Sub-facets, 3 per domain (4 questions each). */
  facets: readonly string[];
  strong: DomainPole;
  weak: DomainPole;
};

export const DOMAINS: readonly WellnessDomain[] = [
  {
    key: "action",
    position: 1,
    name: "실천의 힘",
    english: "Action",
    summary: "도전 · 탐구 · 목표",
    description:
      "건강을 위해 새로운 것을 시도하고, 스스로 탐구하며, 목표를 세워 실천하는 힘.",
    facets: ["도전", "탐구", "목표"],
    strong: { letter: "A", name: "Active" },
    weak: { letter: "P", name: "Passive" },
  },
  {
    key: "fitness",
    position: 2,
    name: "건강한 몸",
    english: "Fitness",
    summary: "신체 활동 · 영양 · 수면",
    description: "몸을 움직이고, 잘 먹고, 충분히 자며 몸을 돌보는 기초 체력.",
    facets: ["신체 활동", "영양", "수면"],
    strong: { letter: "F", name: "Fit" },
    weak: { letter: "W", name: "Worn" },
  },
  {
    key: "calm",
    position: 3,
    name: "고요한 중심",
    english: "Calm",
    summary: "스트레스 회복 · 태도 · 휴식",
    description: "스트레스를 회복하고, 긍정적 태도를 유지하며, 의도적으로 쉬는 힘.",
    facets: ["스트레스 회복", "태도", "휴식"],
    strong: { letter: "C", name: "Calm" },
    weak: { letter: "T", name: "Tense" },
  },
  {
    key: "heart",
    position: 4,
    name: "나를 채우는 것들",
    english: "Heart",
    summary: "목적 · 관계 · 에너지",
    description: "삶의 목적, 사람과의 관계, 나를 채우는 에너지로 마음을 채우는 힘.",
    facets: ["목적", "관계", "에너지"],
    strong: { letter: "H", name: "Heartful" },
    weak: { letter: "E", name: "Empty" },
  },
] as const;

export const DOMAIN_BY_KEY: Readonly<Record<DomainKey, WellnessDomain>> =
  Object.fromEntries(DOMAINS.map((d) => [d.key, d])) as Readonly<
    Record<DomainKey, WellnessDomain>
  >;

/** Ordered list of domains by their position in the code (1→4). */
export const DOMAINS_IN_ORDER: readonly WellnessDomain[] = [...DOMAINS].sort(
  (a, b) => a.position - b.position,
);
