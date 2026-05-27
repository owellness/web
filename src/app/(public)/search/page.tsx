import type { Metadata } from "next";

import { SITE_NAME, SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "검색",
  description: `${SITE_NAME}의 웰니스 콘텐츠를 검색합니다.`,
  alternates: { canonical: `${SITE_URL}/search` },
};

export default function SearchPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          검색
        </h1>
        <p className="text-sm text-muted-foreground">
          한국어 형태소 + 초성 검색은 곧 추가됩니다.
        </p>
      </header>
      <form className="mt-8" role="search" method="get">
        <input
          type="search"
          name="q"
          placeholder="예: 수면, 단식, 스트레칭"
          className="w-full rounded-full border border-border bg-card px-5 py-3 text-base text-card-foreground outline-none focus:border-accent"
        />
      </form>
      <p className="mt-12 text-center text-sm text-muted-foreground">
        준비 중입니다. 뉴스레터를 구독하시면 검색 베타가 열릴 때 알려드립니다.
      </p>
    </section>
  );
}
