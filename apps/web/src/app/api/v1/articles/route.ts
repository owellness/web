import { NextResponse } from "next/server";

import {
  articleFeedQuerySchema,
  type ArticleFeedResponse,
} from "@owellness/shared/api/v1";

import { ApplicationError } from "@/application/shared/errors";
import { articleService } from "@/composition";

import { errorResponse } from "../_lib/respond";

export const dynamic = "force-dynamic";

/** 공개 아티클 피드 (인증 불필요). 계약: @owellness/shared/api/v1 (articles). */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = articleFeedQuerySchema.safeParse(
      Object.fromEntries(url.searchParams),
    );
    if (!parsed.success) {
      throw new ApplicationError("VALIDATION_FAILED", "invalid query");
    }
    const { limit, cursor, category, sort } = parsed.data;

    const page = await articleService.list(
      { status: "published", categorySlug: category, sort },
      { limit, cursor: cursor ?? null },
    );

    const body: ArticleFeedResponse = {
      items: page.items.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        categorySlug: a.primaryCategorySlug,
        authorName: a.authorName,
        ogImageUrl: a.ogImageUrl,
        readingTimeSec: a.readingTimeSec,
        publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
      })),
      nextCursor: page.nextCursor,
    };
    return NextResponse.json(body);
  } catch (e) {
    return errorResponse(e);
  }
}
