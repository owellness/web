import type { Metadata } from "next";

import { SITE_NAME, SITE_URL } from "@/config/site";
import { ArticleCard } from "@/presentation/components/public/ArticleCard";

import { searchService } from "@/composition";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const title = q ? `'${q}' 검색 결과` : "검색";
  return {
    title,
    description: `${SITE_NAME}의 웰니스 콘텐츠를 검색합니다.`,
    alternates: { canonical: `${SITE_URL}/search` },
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const results = query
    ? await searchService.search(query, 30).catch(() => [])
    : [];

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          검색
        </h1>
        <p className="text-sm text-muted-foreground">
          한국어 단어·자모·초성(2글자 이상)으로 검색할 수 있습니다.
        </p>
      </header>

      <form
        className="mt-6"
        role="search"
        method="get"
        action="/search"
      >
        <input
          type="search"
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="예: 수면, 단식, ㅅㅁ"
          className="w-full rounded-full border border-border bg-card px-5 py-3 text-base text-card-foreground outline-none focus:border-accent"
        />
      </form>

      {query ? (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">
            {results.length > 0
              ? `'${query}'에 대한 ${results.length}개의 결과`
              : `'${query}'에 대한 결과가 없습니다.`}
          </p>
          {results.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          검색어를 입력해주세요.
        </p>
      )}
    </section>
  );
}
