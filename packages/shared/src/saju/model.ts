export type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";
export type Polarity = "yang" | "yin";
export type PillarKey = "year" | "month" | "day" | "time";
export type WellnessThemeKey = "action" | "body" | "calm" | "relationship";

export const SAJU_RESULT_STORAGE_KEY = "saju-wellness-result-v1";
export const SAJU_RESULT_VERSION = 1 as const;

export type ElementDefinition = {
  key: ElementKey;
  hangul: string;
  hanja: string;
  color: string;
  symbolism: string;
  reflection: string;
};

export const ELEMENTS: readonly ElementDefinition[] = [
  {
    key: "wood",
    hangul: "목",
    hanja: "木",
    color: "#4f7f5a",
    symbolism: "성장과 방향",
    reflection: "새로운 일을 시작하고 조금씩 키워가는 장면을 떠올려보세요.",
  },
  {
    key: "fire",
    hangul: "화",
    hanja: "火",
    color: "#c9654b",
    symbolism: "표현과 온기",
    reflection: "즐거움과 활기를 어디에서 나누고 있는지 돌아보세요.",
  },
  {
    key: "earth",
    hangul: "토",
    hanja: "土",
    color: "#ad843f",
    symbolism: "안정과 반복",
    reflection: "일상을 받쳐주는 리듬과 꾸준히 지키는 것을 살펴보세요.",
  },
  {
    key: "metal",
    hangul: "금",
    hanja: "金",
    color: "#6f7782",
    symbolism: "기준과 정돈",
    reflection: "덜어내고 경계를 세울 때 편안해지는 순간을 찾아보세요.",
  },
  {
    key: "water",
    hangul: "수",
    hanja: "水",
    color: "#4d7392",
    symbolism: "휴식과 탐색",
    reflection: "멈추어 관찰하거나 자연스럽게 흐름을 바꾸는 방식을 돌아보세요.",
  },
] as const;

export const ELEMENT_BY_KEY = Object.fromEntries(
  ELEMENTS.map((element) => [element.key, element]),
) as Readonly<Record<ElementKey, ElementDefinition>>;

export const STEMS = {
  甲: { hangul: "갑", element: "wood", polarity: "yang" },
  乙: { hangul: "을", element: "wood", polarity: "yin" },
  丙: { hangul: "병", element: "fire", polarity: "yang" },
  丁: { hangul: "정", element: "fire", polarity: "yin" },
  戊: { hangul: "무", element: "earth", polarity: "yang" },
  己: { hangul: "기", element: "earth", polarity: "yin" },
  庚: { hangul: "경", element: "metal", polarity: "yang" },
  辛: { hangul: "신", element: "metal", polarity: "yin" },
  壬: { hangul: "임", element: "water", polarity: "yang" },
  癸: { hangul: "계", element: "water", polarity: "yin" },
} as const satisfies Record<
  string,
  { hangul: string; element: ElementKey; polarity: Polarity }
>;

export type StemKey = keyof typeof STEMS;

export const BRANCHES = {
  子: { hangul: "자", element: "water" },
  丑: { hangul: "축", element: "earth" },
  寅: { hangul: "인", element: "wood" },
  卯: { hangul: "묘", element: "wood" },
  辰: { hangul: "진", element: "earth" },
  巳: { hangul: "사", element: "fire" },
  午: { hangul: "오", element: "fire" },
  未: { hangul: "미", element: "earth" },
  申: { hangul: "신", element: "metal" },
  酉: { hangul: "유", element: "metal" },
  戌: { hangul: "술", element: "earth" },
  亥: { hangul: "해", element: "water" },
} as const satisfies Record<string, { hangul: string; element: ElementKey }>;

export type BranchKey = keyof typeof BRANCHES;

export type SajuPillar = {
  key: PillarKey;
  stem: StemKey;
  branch: BranchKey;
  stemElement: ElementKey;
  branchElement: ElementKey;
};

export type ElementCounts = Readonly<Record<ElementKey, number>>;

export type WellnessTheme = {
  key: WellnessThemeKey;
  name: string;
  insight: string;
  question: string;
};

export type DayMasterProfile = {
  stem: StemKey;
  emoji: string;
  name: string;
  tagline: string;
  introduction: string;
  themes: readonly WellnessTheme[];
  practices: readonly string[];
};

export type SajuWellnessResult = {
  version: typeof SAJU_RESULT_VERSION;
  dayMaster: StemKey;
  pillars: Readonly<{
    year: SajuPillar;
    month: SajuPillar;
    day: SajuPillar;
    time: SajuPillar | null;
  }>;
  elementCounts: ElementCounts;
  includedSymbols: 6 | 8;
  timeKnown: boolean;
  termBoundaryAdjusted: boolean;
};

export type SajuInput = {
  /** Gregorian date in YYYY-MM-DD. The first release supports solar dates only. */
  birthDate: string;
  /** Korea-local clock time in HH:mm, or null when unknown. */
  birthTime: string | null;
};
