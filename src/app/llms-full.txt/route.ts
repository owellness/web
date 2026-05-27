import { buildLlmsFullTxt } from "@/application/seo/llms";
import { articleService } from "@/composition";
import { SITE_NAME, SITE_URL } from "@/config/site";

export const revalidate = 600;

export async function GET() {
  const articles = await articleService
    .listAllPublishedFull()
    .catch(() => []);

  const body = buildLlmsFullTxt({
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    tagline: "한국어 웰니스 콘텐츠 — LLM 인용용 전체 본문",
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
