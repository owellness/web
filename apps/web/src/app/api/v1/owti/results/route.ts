import { NextResponse } from "next/server";

import { appAuthService, owtiResultService } from "@/composition";

import { errorResponse } from "../../_lib/respond";

export const dynamic = "force-dynamic";

/** 검사 응답 제출 (Bearer 필요). 채점은 서버가 공유 로직으로 재계산. */
export async function POST(request: Request) {
  try {
    const userId = await appAuthService.authenticate(
      request.headers.get("authorization"),
    );
    const body = await request.json().catch(() => null);
    const result = await owtiResultService.submit(userId, body);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

/** 내 결과 히스토리 최신순 (Bearer 필요). */
export async function GET(request: Request) {
  try {
    const userId = await appAuthService.authenticate(
      request.headers.get("authorization"),
    );
    return NextResponse.json(await owtiResultService.history(userId));
  } catch (e) {
    return errorResponse(e);
  }
}
