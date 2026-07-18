import { z } from "zod";

/** 모든 v1 엔드포인트가 실패 시 반환하는 오류 봉투. */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum([
      "VALIDATION_FAILED",
      "UNAUTHORIZED",
      "FORBIDDEN",
      "NOT_FOUND",
      "RATE_LIMITED",
      "INTERNAL",
    ]),
    message: z.string(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/** 커서 기반 페이지네이션 쿼리 (웹 application 계층의 Pagination과 동일 모델). */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
