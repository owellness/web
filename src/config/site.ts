// Categories are now DB-driven at runtime. This string alias is kept so older
// imports keep compiling; treat it as `string` everywhere.
export type CategorySlug = string;

export type CategoryDefinition = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  keywords: string[];
};

export const CATEGORIES: readonly CategoryDefinition[] = [
  {
    slug: "sleep",
    name: "수면 · 스트레스 · 정신건강",
    shortName: "수면 · 정신",
    description:
      "수면의 질을 높이고 스트레스를 다스리는 과학 기반 가이드. 수면 위생, 번아웃 회복, 명상까지.",
    keywords: ["수면", "불면증", "스트레스", "번아웃", "명상", "정신건강"],
  },
  {
    slug: "nutrition",
    name: "영양 · 다이어트 · 식이요법",
    shortName: "영양 · 식이",
    description:
      "지속 가능한 식습관과 영양제 가이드. 단식, 케토, 지중해식, 한국형 식단을 근거 기반으로 정리합니다.",
    keywords: ["영양", "다이어트", "단식", "영양제", "식단", "체중감량"],
  },
  {
    slug: "fitness",
    name: "운동 · 홈트 · 근력",
    shortName: "운동 · 근력",
    description:
      "초보부터 중급까지 활용할 수 있는 홈트, 근력, 유산소 루틴과 자세 교정 콘텐츠.",
    keywords: ["운동", "홈트", "근력", "유산소", "자세교정", "스트레칭"],
  },
  {
    slug: "women",
    name: "여성 · 호르몬 · 갱년기",
    shortName: "여성 건강",
    description:
      "여성 라이프스테이지별 건강 관리: 생리주기, PMS, 임신·출산, 갱년기, 호르몬 균형을 정리한 가이드.",
    keywords: ["여성건강", "생리", "호르몬", "갱년기", "PMS", "에스트로겐"],
  },
] as const;

export const CATEGORY_BY_SLUG: Readonly<Record<CategorySlug, CategoryDefinition>> =
  Object.fromEntries(CATEGORIES.map((c) => [c.slug, c])) as Readonly<
    Record<CategorySlug, CategoryDefinition>
  >;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "오 웰니스";

export const SITE_CONFIG = {
  name: SITE_NAME,
  legalName: "오 웰니스",
  url: SITE_URL,
  locale: "ko_KR" as const,
  description:
    "수면, 영양, 운동, 여성 건강까지. 근거 기반 웰니스 콘텐츠와 큐레이션을 제공하는 오 웰니스입니다.",
  defaultOgImage: `${SITE_URL}/api/og`,
  twitter: undefined as string | undefined,
  authorOrg: {
    name: "오 웰니스",
    url: SITE_URL,
  },
  social: {
    instagram: undefined as string | undefined,
    youtube: undefined as string | undefined,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    naver: process.env.NAVER_SITE_VERIFICATION,
  },
} as const;

// Branded 1200×630 social-share image via the dynamic OG route
// (src/app/api/og). Centralized so every page links a real generated image
// instead of a static file that may not exist.
export const ogImageUrl = (params?: {
  title?: string;
  category?: string;
  author?: string;
}): string => {
  const base = `${SITE_URL}/api/og`;
  const sp = new URLSearchParams();
  if (params?.title) sp.set("title", params.title);
  if (params?.category) sp.set("category", params.category);
  if (params?.author) sp.set("author", params.author);
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
};

export const DEFAULT_LOCALE = "ko" as const;
