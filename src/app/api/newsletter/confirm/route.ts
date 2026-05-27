import { NextResponse } from "next/server";

import { SITE_URL } from "@/config/site";
import { newsletterService } from "@/composition";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${SITE_URL}/newsletter?status=invalid`);
  }
  try {
    await newsletterService.confirm(token);
    return NextResponse.redirect(`${SITE_URL}/newsletter?status=confirmed`);
  } catch {
    return NextResponse.redirect(`${SITE_URL}/newsletter?status=invalid`);
  }
}
