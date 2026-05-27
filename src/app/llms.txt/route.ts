import { buildLlmsTxt } from "@/application/seo/llms";
import { articleService } from "@/composition";
import { CATEGORIES, SITE_CONFIG, SITE_NAME, SITE_URL } from "@/config/site";

export const revalidate = 600;

export async function GET() {
  const { items: articles } = await articleService
    .list({ status: "published" }, { limit: 200 })
    .catch(() => ({ items: [], nextCursor: null }));

  const body = buildLlmsTxt({
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    tagline: "한국어 웰니스 콘텐츠 허브 — 수면·영양·운동·여성 건강 근거 기반 가이드",
    description: SITE_CONFIG.description,
    categories: CATEGORIES.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      url: `${SITE_URL}/${c.slug}`,
    })),
    articles,
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}
