import { z } from "zod";

import { SCALE_MAX, SCALE_MIN, TOTAL_QUESTIONS } from "../../owti/model";

/** 도메인 키 (owti/model.ts DomainKey와 동일 집합) */
export const domainKeySchema = z.enum(["action", "fitness", "calm", "heart"]);

/**
 * POST /api/v1/owti/results 요청 본문.
 * answers: 문항 id(1–48, 문자열 키) → 리커트 응답(1–5).
 * 채점은 서버가 @owellness/shared/owti 로직으로 재계산한다 — 클라이언트 점수는 신뢰하지 않는다.
 */
export const owtiSubmissionSchema = z.object({
  answers: z
    .record(z.string(), z.number().int().min(SCALE_MIN).max(SCALE_MAX))
    .refine((a) => Object.keys(a).length === TOTAL_QUESTIONS, {
      message: `answers must contain exactly ${TOTAL_QUESTIONS} entries`,
    }),
});
export type OwtiSubmission = z.infer<typeof owtiSubmissionSchema>;

export const owtiResultDtoSchema = z.object({
  id: z.uuid(),
  /** 4글자 유형 코드 (예: "AFTE") */
  typeCode: z.string().length(4),
  /** 영역별 평균(1–5 소수) */
  domainAverages: z.record(domainKeySchema, z.number()),
  createdAt: z.iso.datetime(),
});
export type OwtiResultDto = z.infer<typeof owtiResultDtoSchema>;

/** GET /api/v1/owti/results 응답 — 최신순 히스토리. */
export const owtiResultListSchema = z.object({
  items: z.array(owtiResultDtoSchema),
});
export type OwtiResultList = z.infer<typeof owtiResultListSchema>;
