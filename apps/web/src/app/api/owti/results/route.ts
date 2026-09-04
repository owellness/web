import { NextResponse } from "next/server";

import { owtiResultService } from "@/composition";
import { auth } from "@/infrastructure/auth/authConfig";
import { errorResponse } from "@/app/api/v1/_lib/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const result = await owtiResultService.submit(session.user.id, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    return NextResponse.json(await owtiResultService.history(session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
