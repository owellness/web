import type { Metadata } from "next";
import Link from "next/link";

import { buildBreadcrumbJsonLd } from "@/application/seo/jsonld";
import { articleService } from "@/composition";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { JsonLd } from "@/presentation/components/public/JsonLd";
import { resolveDefaultOgImage } from "@/presentation/lib/siteSettings";

// Refresh the ranking roughly once a minute. View counts climb continuously,
// so we trade a little staleness for cache efficiency rather than rendering
// this list dynamically on every request.
export const revalidate = 60;

const PAGE_TITLE = "인기 콘텐츠";
const PAGE_DESCRIPTION =
  "지금 가장 많이 읽고 있는 오! 웰니스 콘텐츠를 모았습니다.";

const formatReadingTime = (sec: number): string =>
  `${Math.max(1, Math.round(sec / 60))}분 읽기`;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    alternates: { canonical: `${SITE_URL}/popular` },
    openGraph: {
      title: `${PAGE_TITLE} | ${SITE_NAME}`,
      description: PAGE_DESCRIPTION,
      url: `${SITE_URL}/popular`,
      type: "website",
      siteName: SITE_NAME,
      images: [await resolveDefaultOgImage()],
    },
  };
}

export default async function PopularPage() {
  // Resilient to DB unavailability during build (placeholder URL) — the first
  // real request after ISR revalidation repopulates the ranking.
  const items = await articleService.listPopular(24).catch((error) => {
    console.warn("[popular] DB unavailable:", error);
    return [];
  });

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: SITE_NAME, url: SITE_URL },
    { name: PAGE_TITLE, url: `${SITE_URL}/popular` },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumb} />
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            가장 많이 본
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
            {PAGE_TITLE}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {PAGE_DESCRIPTION}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
            아직 집계된 순위가 없습니다. 콘텐츠를 둘러보시면 인기 순위가
            채워집니다.
          </div>
        ) : (
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((article, index) => (
              <li key={article.id}>
                <Link
                  href={`/${article.primaryCategorySlug}/${article.slug}`}
                  className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition hover:border-accent/40 hover:bg-muted/40"
                >
                  <span
                    aria-hidden
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent"
                  >
                    {index + 1}
                  </span>
                  <h2 className="text-lg font-semibold leading-snug text-card-foreground group-hover:text-accent">
                    <span className="sr-only">{index + 1}위. </span>
                    {article.title}
                  </h2>
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {article.excerpt}
                  </p>
                  <p className="mt-auto text-xs text-muted-foreground">
                    {article.authorName} · {formatReadingTime(article.readingTimeSec)}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
