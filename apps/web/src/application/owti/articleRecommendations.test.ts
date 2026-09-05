import assert from "node:assert/strict";
import { test } from "node:test";

import type { ArticleSummary } from "@/application/articles/model";
import { ALL_CODES } from "@owellness/shared/owti";

import { recommendArticlesForOwti } from "./articleRecommendations";

const article = (
  id: string,
  primaryCategorySlug: string,
  title: string,
  excerpt: string,
): ArticleSummary => ({
  id,
  slug: id,
  title,
  excerpt,
  status: "published",
  publishedAt: new Date(
    `2026-08-${String(20 - Number(id)).padStart(2, "0")}T00:00:00Z`,
  ),
  updatedAt: new Date("2026-08-20T00:00:00Z"),
  primaryCategorySlug,
  authorSlug: "author",
  authorName: "Author",
  ogImageUrl: null,
  readingTimeSec: 300,
  viewCount: 0,
});

const catalogue = [
  article("1", "sleep", "멜라토닌과 수면 루틴", "잠과 회복을 돕는 방법"),
  article("2", "sleep", "번아웃 뒤의 휴식", "스트레스와 불안을 낮추는 회복"),
  article("3", "sleep", "사회적 연결 진단", "관계의 질과 고립을 점검합니다"),
  article("4", "sleep", "외로움과 공동체", "친구와 가족의 돌봄"),
  article("5", "fitness", "걷기의 추진력", "신체 활동을 시작하는 방법"),
  article("6", "fitness", "근력 운동의 원리", "체력과 자세를 다룹니다"),
  article("7", "nutrition", "단백질과 식단", "영양 습관을 개선합니다"),
  article("8", "nutrition", "지속 가능한 식사 루틴", "작은 변화와 실천"),
  article("9", "women", "호르몬 주기와 트레이닝", "회복과 운동 조율"),
  article("10", "women", "갱년기 수면 변화", "피곤함과 신체 신호"),
];

test("physical and relationship weaknesses lead with different content", () => {
  const physical = recommendArticlesForOwti("AWCH", catalogue, 4);
  const relationship = recommendArticlesForOwti("AFCE", catalogue, 4);

  assert.ok(
    ["fitness", "nutrition", "women"].includes(
      physical[0]!.primaryCategorySlug,
    ),
  );
  assert.match(
    `${relationship[0]!.title} ${relationship[0]!.excerpt}`,
    /연결|관계|고립|외로움|공동체/,
  );
  assert.notDeepEqual(
    physical.map((item) => item.id),
    relationship.map((item) => item.id),
  );
});

test("all 16 result types produce distinct ranked lists", () => {
  const rankings = ALL_CODES.map((code) =>
    recommendArticlesForOwti(code, catalogue, 6)
      .map((item) => item.id)
      .join(","),
  );

  assert.equal(new Set(rankings).size, ALL_CODES.length);
});

test("ranking is stable, deduplicated, and rejects unknown codes", () => {
  const withDuplicate = [...catalogue, catalogue[0]!];
  const first = recommendArticlesForOwti("PWTE", withDuplicate, 6);
  const second = recommendArticlesForOwti("pwte", withDuplicate, 6);

  assert.deepEqual(first, second);
  assert.equal(new Set(first.map((item) => item.id)).size, first.length);
  assert.deepEqual(recommendArticlesForOwti("NOPE", catalogue), []);
  assert.deepEqual(recommendArticlesForOwti("AFCH", catalogue, 0), []);
});
