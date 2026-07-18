import { NextResponse } from "next/server";

import { appAuthService } from "@/composition";

import { errorResponse } from "../../_lib/respond";

export const dynamic = "force-dynamic";

/** 카카오 액세스 토큰 → 앱 Bearer 토큰 교환. 계약: @owellness/shared/api/v1 (auth). */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const result = await appAuthService.loginWithKakao(body);
    return NextResponse.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
