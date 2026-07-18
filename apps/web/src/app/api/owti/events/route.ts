import { NextResponse } from "next/server";

import { owtiAnalyticsService } from "@/composition";

export const dynamic = "force-dynamic";

// Anonymous OWTI funnel beacon. Called by the quiz (navigator.sendBeacon /
// fetch keepalive) to record start / advance / complete events. Best-effort:
// always answers 204 so it never blocks or surfaces errors to the user.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    await owtiAnalyticsService.record(body);
  } catch (e) {
    console.warn("[owti/events] ignored:", e);
  }
  return new NextResponse(null, { status: 204 });
}
