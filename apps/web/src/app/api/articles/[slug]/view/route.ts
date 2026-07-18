import { NextResponse } from "next/server";

import { articleService } from "@/composition";

// View tracking must run on every visit, so this handler is never cached.
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    await articleService.recordView(slug);
  } catch (e) {
    // Best-effort: a failed view increment must never surface to the reader.
    console.warn("[api/articles/view] increment failed (ignored)", e);
  }
  // Always 200 with no-store: the client fires this fire-and-forget and never
  // reads the body, and we don't want a stale/cached response short-circuiting
  // future increments.
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
