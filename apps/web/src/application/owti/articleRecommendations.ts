import type { ArticleSummary } from "@/application/articles/model";
import {
  DOMAINS_IN_ORDER,
  TYPE_BY_CODE,
  weakDomainsFromCode,
  type DomainKey,
} from "@owellness/shared/owti";

type DomainSignals = {
  categoryWeights: Readonly<Record<string, number>>;
  keywords: readonly string[];
};

// These signals deliberately use metadata that every existing article already
// has. Editors do not need to add OWTI fields or retag the current catalogue.
const DOMAIN_SIGNALS: Readonly<Record<DomainKey, DomainSignals>> = {
  action: {
    categoryWeights: { fitness: 14, nutrition: 12, sleep: 5, women: 5 },
    keywords: [
      "습관",
      "루틴",
      "실천",
      "목표",
      "동기",
      "시작",
      "변화",
      "지속",
      "계획",
      "도전",
      "행동",
    ],
  },
  fitness: {
    categoryWeights: { fitness: 18, nutrition: 16, sleep: 9, women: 11 },
    keywords: [
      "운동",
      "근력",
      "걷기",
      "보행",
      "신체",
      "자세",
      "체력",
      "스트레칭",
      "트레이닝",
      "단백질",
      "영양",
      "식단",
      "회복",
    ],
  },
  calm: {
    categoryWeights: { sleep: 20, women: 5, nutrition: 3, fitness: 3 },
    keywords: [
      "스트레스",
      "번아웃",
      "수면",
      "멜라토닌",
      "휴식",
      "회복",
      "마음",
      "명상",
      "불안",
      "감정",
      "피곤",
      "스마트폰",
      "낮잠",
      "잠",
    ],
  },
  heart: {
    categoryWeights: { sleep: 14, women: 6, fitness: 2, nutrition: 2 },
    keywords: [
      "관계",
      "연결",
      "외로움",
      "사회적",
      "공동체",
      "친구",
      "가족",
      "에너지",
      "목적",
      "고립",
      "돌봄",
      "행복",
    ],
  },
};

// Domain signals do most of the ranking. These smaller, type-level hints make
// combinations with adjacent weak areas reflect the actual guidance shown on
// that result page instead of collapsing back to the same category list.
const TYPE_FOCUS_KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  AFCH: ["균형", "지속", "휴식", "번아웃", "회복"],
  AFCE: ["사회적", "연결", "관계", "고립", "에너지"],
  AFTH: ["스트레스", "명상", "휴식", "회복", "번아웃"],
  AFTE: ["사회적", "연결", "관계", "외로움", "감정", "그룹"],
  AWCH: ["운동", "영양", "식단", "근력", "걷기", "신체"],
  AWCE: ["걷기", "명상", "관계", "연결", "운동", "신체"],
  AWTH: ["번아웃", "수면", "휴식", "스트레스", "회복"],
  AWTE: ["걷기", "운동", "회복", "수면", "영양", "시작"],
  PFCH: ["습관", "루틴", "지속", "변화", "목표", "실천"],
  PFCE: ["사회적", "연결", "관계", "고립", "에너지", "공동체"],
  PFTH: ["스트레스", "마음", "감정", "명상", "휴식", "회복"],
  PFTE: ["스트레스", "수면", "관계", "연결", "에너지", "회복"],
  PWCH: ["운동", "영양", "신체", "걷기", "근력", "트레이닝"],
  PWCE: ["운동", "영양", "관계", "연결", "걷기", "신체"],
  PWTH: ["수면", "스트레스", "운동", "영양", "휴식", "회복"],
  PWTE: ["수면", "습관", "루틴", "걷기", "영양", "시작"],
};

const normalize = (value: string) => value.normalize("NFC").toLowerCase();

const keywordScore = (
  article: ArticleSummary,
  keywords: readonly string[],
  titleWeight: number,
  excerptWeight: number,
) => {
  const title = normalize(article.title);
  const excerpt = normalize(article.excerpt);

  return keywords.reduce((score, rawKeyword) => {
    const keyword = normalize(rawKeyword);
    if (title.includes(keyword)) return score + titleWeight;
    if (excerpt.includes(keyword)) return score + excerptWeight;
    return score;
  }, 0);
};

// FNV-1a produces a stable type/article affinity. It only resolves close
// relevance scores, so it adds variety without promoting unrelated content.
const stableAffinity = (value: string) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) / 0xffffffff;
};

type ScoredArticle = {
  article: ArticleSummary;
  affinity: number;
  relevance: number;
};

const scoreArticle = (
  code: string,
  focusDomains: readonly DomainKey[],
  article: ArticleSummary,
): ScoredArticle => {
  let relevance = 0;

  for (const domain of focusDomains) {
    const signals = DOMAIN_SIGNALS[domain];
    relevance += signals.categoryWeights[article.primaryCategorySlug] ?? 0;
    relevance += keywordScore(article, signals.keywords, 10, 4);
  }

  relevance += keywordScore(
    article,
    TYPE_FOCUS_KEYWORDS[code] ?? [],
    14,
    6,
  );

  return {
    article,
    relevance,
    affinity: stableAffinity(`${code}:${article.id}`),
  };
};

/**
 * Ranks existing published articles for an OWTI result.
 *
 * The input is expected to be newest-first. Relevance leads; a small stable
 * affinity separates otherwise similar articles per type, and a repeat penalty
 * prevents one broad category from filling the whole recommendation block.
 */
export const recommendArticlesForOwti = (
  codeInput: string,
  articles: readonly ArticleSummary[],
  limit = 6,
): ArticleSummary[] => {
  if (limit <= 0) return [];

  const code = codeInput.toUpperCase();
  if (!TYPE_BY_CODE[code]) return [];

  const weakDomains = weakDomainsFromCode(code).map((domain) => domain.key);
  const focusDomains =
    weakDomains.length > 0
      ? weakDomains
      : DOMAINS_IN_ORDER.map((domain) => domain.key);

  const uniqueArticles = [
    ...new Map(articles.map((article) => [article.id, article])).values(),
  ];
  const remaining = uniqueArticles.map((article) =>
    scoreArticle(code, focusDomains, article),
  );
  const selected: ArticleSummary[] = [];
  const categoryCounts = new Map<string, number>();

  while (remaining.length > 0 && selected.length < limit) {
    remaining.sort((left, right) => {
      const leftRepeats =
        categoryCounts.get(left.article.primaryCategorySlug) ?? 0;
      const rightRepeats =
        categoryCounts.get(right.article.primaryCategorySlug) ?? 0;
      const leftScore =
        left.relevance - leftRepeats * 7 + left.affinity * 5;
      const rightScore =
        right.relevance - rightRepeats * 7 + right.affinity * 5;

      if (rightScore !== leftScore) return rightScore - leftScore;
      const rightPublished = right.article.publishedAt?.getTime() ?? 0;
      const leftPublished = left.article.publishedAt?.getTime() ?? 0;
      return rightPublished - leftPublished;
    });

    const [next] = remaining.splice(0, 1);
    if (!next) break;
    selected.push(next.article);
    categoryCounts.set(
      next.article.primaryCategorySlug,
      (categoryCounts.get(next.article.primaryCategorySlug) ?? 0) + 1,
    );
  }

  return selected;
};
