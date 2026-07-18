import {
  owtiSubmissionSchema,
  type OwtiResultDto,
  type OwtiResultList,
} from "@owellness/shared/api/v1";
import { computeResult, isComplete, type Answers } from "@owellness/shared/owti";

import { ApplicationError } from "@/application/shared/errors";

import type { OwtiResultRecord, OwtiResultRepository } from "./ports";

const toDto = (r: OwtiResultRecord): OwtiResultDto => ({
  id: r.id,
  typeCode: r.typeCode,
  domainAverages: r.domainAverages,
  createdAt: r.createdAt.toISOString(),
});

export const createOwtiResultService = (repository: OwtiResultRepository) => ({
  /**
   * 검사 응답 제출. 점수·유형은 공유 채점 로직으로 서버가 재계산한다 —
   * 클라이언트가 보낸 점수는 어떤 경우에도 신뢰하지 않는다.
   */
  async submit(userId: string, rawInput: unknown): Promise<OwtiResultDto> {
    const parsed = owtiSubmissionSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new ApplicationError("VALIDATION_FAILED", "invalid submission");
    }

    const answers = parsed.data.answers as Answers;
    if (!isComplete(answers)) {
      throw new ApplicationError(
        "VALIDATION_FAILED",
        "answers must cover all 48 questions with values 1-5",
      );
    }

    const result = computeResult(answers);
    const domainAverages = Object.fromEntries(
      result.scores.map((s) => [s.domain.key, s.average]),
    );

    const saved = await repository.insert({
      userId,
      answers: parsed.data.answers,
      domainAverages,
      typeCode: result.code,
    });
    return toDto(saved);
  },

  async history(userId: string): Promise<OwtiResultList> {
    const rows = await repository.listByUser(userId);
    return { items: rows.map(toDto) };
  },
});

export type OwtiResultService = ReturnType<typeof createOwtiResultService>;
