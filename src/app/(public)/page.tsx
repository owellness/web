import type { Metadata } from "next";
import Link from "next/link";

import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "@/application/seo/jsonld";
import { categoryService } from "@/composition";
import { SITE_CONFIG, SITE_NAME, SITE_URL } from "@/config/site";
import { JsonLd } from "@/presentation/components/public/JsonLd";

export const revalidate = 300; // ISR every 5 min

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

export default async function HomePage() {
  const cats = await categoryService.listAll().catch(() => []);
  const ctaSlug = cats[0]?.slug;
  return (
    <>
      <JsonLd schema={buildWebSiteJsonLd(SITE_CONFIG)} />
      <JsonLd schema={buildOrganizationJsonLd(SITE_CONFIG)} />
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-20 sm:px-6 md:py-28">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            Evidence-based wellness
          </p>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            잘 자고, 잘 먹고, 잘 움직이는 법.
            <br className="hidden sm:block" />
            {SITE_NAME}이 매주 정리합니다.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            수면, 영양, 운동, 여성 건강. 흩어진 웰니스 정보를 근거와 함께
            한곳에서 만나보세요. 곧 출시될 오 웰니스 앱의 진단·코칭 기능을
            가장 먼저 받아볼 수 있도록 뉴스레터를 보내드립니다.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/newsletter"
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
            >
              뉴스레터 구독하기
            </Link>
            {ctaSlug ? (
              <Link
                href={`/${ctaSlug}`}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                인기 콘텐츠 보기
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          카테고리
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cats.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${cat.slug}`}
              className="group rounded-2xl border border-border bg-card p-6 transition hover:border-accent/40 hover:bg-muted/40"
            >
              <h3 className="text-lg font-semibold text-card-foreground">
                {cat.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
