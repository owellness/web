import { NextResponse } from "next/server";

import { appAuthService } from "@/composition";

import { errorResponse } from "../../../_lib/respond";

export const dynamic = "force-dynamic";

/** 이메일 회원가입 후 앱용 Bearer 토큰을 발급한다. */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const result = await appAuthService.signupWithEmail(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
