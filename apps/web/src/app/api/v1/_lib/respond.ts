import { NextResponse } from "next/server";

import type { ApiError } from "@owellness/shared/api/v1";

import { ApplicationError } from "@/application/shared/errors";

const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

/** ApplicationError → 공유 계약(apiErrorSchema)의 오류 봉투로 변환. */
export const errorResponse = (e: unknown): NextResponse<ApiError> => {
  if (e instanceof ApplicationError) {
    const status = STATUS_BY_CODE[e.code] ?? 500;
    const code = (
      e.code in STATUS_BY_CODE && e.code !== "ALREADY_EXISTS"
        ? e.code
        : "INTERNAL"
    ) as ApiError["error"]["code"];
    return NextResponse.json(
      { error: { code, message: e.message } },
      { status },
    );
  }
  console.error("[api/v1] unhandled:", e);
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "internal error" } },
    { status: 500 },
  );
};
