import type { z } from "zod";

// Zod 실패를 관리자가 읽을 수 있는 한국어 문장으로 바꾼다.
// ZodError.message는 issue 배열을 그대로 JSON 직렬화한 값이라, 그대로 노출하면
// 관리자 화면에 `[{"origin":"string","code":"too_big",...}]`가 찍힌다.

/** 관리자 폼에 노출되는 필드의 한국어 이름. 없으면 경로를 그대로 쓴다. */
const FIELD_LABELS: Record<string, string> = {
  // 아티클
  title: "제목",
  slug: "슬러그",
  excerpt: "요약",
  tldr: "TL;DR",
  contentJson: "본문",
  primaryCategorySlug: "카테고리",
  tagSlugs: "태그",
  seoTitle: "SEO 제목",
  seoDescription: "SEO 설명",
  ogImageUrl: "대표 이미지",
  canonicalUrl: "표준 URL",
  authorId: "작성자",
  medicalReviewerId: "감수자",
  status: "상태",
  // 공통 / 그 외 관리자 폼
  name: "이름",
  email: "이메일",
  description: "설명",
  question: "질문",
  answerHtml: "답변",
  bodyJson: "본문",
  subject: "제목",
};

/** 배열 필드에서 인덱스를 셀 때 쓰는 단위. */
const ITEM_UNITS: Record<string, string> = {
  tldr: "줄",
  tagSlugs: "태그",
};

const labelFor = (path: readonly PropertyKey[]): string => {
  const [head, second] = path;
  if (typeof head !== "string") return "입력값";

  const label = FIELD_LABELS[head] ?? head;
  if (typeof second === "number") {
    return `${label} ${second + 1}번째 ${ITEM_UNITS[head] ?? "항목"}`;
  }
  return label;
};

const describe = (issue: z.core.$ZodIssue): string => {
  // 배열 개수를 셀 때는 필드에 맞는 단위를 쓴다 (TL;DR → "줄").
  const head = issue.path[0];
  const countUnit =
    (typeof head === "string" ? ITEM_UNITS[head] : undefined) ?? "개";

  switch (issue.code) {
    case "too_big": {
      const max = Number(issue.maximum);
      if (issue.origin === "string") return `최대 ${max}자까지 입력할 수 있어요.`;
      if (issue.origin === "array")
        return `최대 ${max}${countUnit}까지 넣을 수 있어요.`;
      return `최대 ${max}까지 입력할 수 있어요.`;
    }
    case "too_small": {
      const min = Number(issue.minimum);
      if (issue.origin === "string") {
        return min <= 1
          ? "필수 입력 항목이에요."
          : `최소 ${min}자 이상 입력해 주세요.`;
      }
      if (issue.origin === "array") {
        return `최소 ${Math.max(min, 1)}${countUnit}은 필요해요.`;
      }
      return `최소 ${min} 이상이어야 해요.`;
    }
    case "invalid_type":
      // 관리자 폼은 값을 항상 문자열로 보내므로, 이 코드는 사실상 "빈 값"이다.
      return "필수 입력 항목이에요.";
    default:
      // 스키마에 직접 적어둔 한국어 메시지(예: 슬러그 규칙)는 그대로 살린다.
      return issue.message;
  }
};

/** 최대 3건까지 "필드: 사유" 형태로 합쳐서 돌려준다. */
export const formatZodError = (error: {
  issues: readonly z.core.$ZodIssue[];
}): string => {
  const lines = error.issues
    .slice(0, 3)
    .map((issue) => `${labelFor(issue.path)}: ${describe(issue)}`);

  if (lines.length === 0) return "입력값을 확인해 주세요.";

  const rest = error.issues.length - lines.length;
  return rest > 0 ? `${lines.join(" ")} 외 ${rest}건` : lines.join(" ");
};
