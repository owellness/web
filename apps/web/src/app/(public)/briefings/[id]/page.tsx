import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { buildBreadcrumbJsonLd } from "@/application/seo/jsonld";
import { SITE_CONFIG, SITE_NAME, SITE_URL } from "@/config/site";
import { JsonLd } from "@/presentation/components/public/JsonLd";

import { externalContentService } from "@/composition";

export const revalidate = 300;
export const dynamicParams = true;

const getBriefing = cache((id: string) =>
  externalContentService.getPublishedById(id),
);

const briefingUrl = (id: string): string => `${SITE_URL}/briefings/${id}`;

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

const metadataDescription = (excerpt: string, body: string): string => {
  const value = (excerpt || body).replace(/\s+/g, " ").trim();
  return value.length > 160 ? `${value.slice(0, 159).trim()}…` : value;
};

const summaryPreview = (value: string): string => {
  const normalized = value.replace(/\s+/g, " ").trim();
  const characters = Array.from(normalized);
  if (characters.length <= 320) return normalized;
  return `${characters.slice(0, 319).join("").trimEnd()}…`;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const briefing = await getBriefing(id);
  if (!briefing) return { robots: { index: false, follow: true } };

  const description = metadataDescription(briefing.excerpt, briefing.body);
  const url = briefingUrl(briefing.id);

  return {
    title: briefing.title,
    description,
    alternates: { canonical: url },
    robots: { index: false, follow: true },
    openGraph: {
      type: "article",
      url,
      title: briefing.title,
      description,
      siteName: SITE_NAME,
      publishedTime: briefing.sourcePublishedAt.toISOString(),
      images: [SITE_CONFIG.defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: briefing.title,
      description,
      images: [SITE_CONFIG.defaultOgImage],
    },
  };
}

export default async function BriefingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const briefing = await getBriefing(id);
  if (!briefing) notFound();

  const hasTranslatedBody = Boolean(briefing.body.trim());
  const translatedParagraphs = (
    hasTranslatedBody ? briefing.body : briefing.excerpt
  )
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const summarySource =
    briefing.excerpt.trim() ||
    translatedParagraphs[0] ||
    "이 글은 RSS에 별도 소개문을 제공하지 않았습니다. 영문 원문에서 전체 내용을 확인해 주세요.";
  const summary = summaryPreview(summarySource);
  const url = briefingUrl(briefing.id);

  return (
    <>
      <JsonLd
        schema={buildBreadcrumbJsonLd([
          { name: SITE_NAME, url: SITE_URL },
          {
            name: "글로벌 웰니스 브리핑",
            url: `${SITE_URL}/#global-wellness-briefing`,
          },
          { name: briefing.title, url },
        ])}
      />

      <article className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6">
        <nav
          aria-label="breadcrumb"
          className="mb-8 text-sm text-muted-foreground"
        >
          <Link href="/" className="hover:text-foreground">
            홈
          </Link>
          <span aria-hidden> · </span>
          <Link
            href="/#global-wellness-briefing"
            className="hover:text-foreground"
          >
            글로벌 웰니스 브리핑
          </Link>
        </nav>

        <header>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <span className="font-semibold text-accent">
              {briefing.sourceName}
            </span>
            <time dateTime={briefing.sourcePublishedAt.toISOString()}>
              {formatDate(briefing.sourcePublishedAt)}
            </time>
            {briefing.sourceAuthor ? <span>{briefing.sourceAuthor}</span> : null}
            {briefing.translatedAt ? (
              <span>번역 {formatDate(briefing.translatedAt)}</span>
            ) : null}
          </div>

          <h1 className="mt-5 text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            {briefing.title}
          </h1>
          <p lang="en" className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {briefing.originalTitle}
          </p>

          <section
            className="mt-8 rounded-2xl border border-accent/25 bg-accent/5 px-5 py-4"
            aria-labelledby="briefing-summary-title"
          >
            <h2
              id="briefing-summary-title"
              className="text-sm font-semibold text-foreground"
            >
              글 본문 3줄 요약
            </h2>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {summary}
            </p>
          </section>
        </header>

        <section className="mt-10" aria-labelledby="translated-content-title">
          <h2
            id="translated-content-title"
            className="text-xl font-semibold tracking-tight text-foreground"
          >
            {hasTranslatedBody ? "번역 본문" : "번역된 소개"}
          </h2>
          <div className="mt-6 space-y-6 text-base leading-8 text-foreground sm:text-lg">
            {translatedParagraphs.length > 0 ? (
              translatedParagraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
              ))
            ) : (
              <p className="text-muted-foreground">
                이 글은 RSS에 번역할 본문이나 소개를 제공하지 않았습니다. 아래
                원문 링크에서 전체 내용을 확인해 주세요.
              </p>
            )}
          </div>
        </section>

        <div className="mt-12 border-t border-border pt-8">
          <a
            href={briefing.sourceUrl}
            target="_blank"
            rel="noopener noreferrer external"
            aria-label={`${briefing.sourceName} 영문 원문 읽기 (새 창)`}
            className="inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            영문 원문 읽기 <span aria-hidden="true">↗</span>
          </a>
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            Papago 자동 번역이며 별도 의료 검수를 거치지 않았습니다. 이 번역은
            원문을 대체하지 않으며 출처와의 제휴·보증을 의미하지 않습니다.
            콘텐츠의 권리는 각 원저작권자에게 있습니다. 원문의 최신 수정 사항은
            번역문에 즉시 반영되지 않을 수 있습니다. {hasTranslatedBody
              ? "RSS로 제공된 본문은 피드 앞부분 최대 24,000자까지만 표시될 수 있습니다. "
              : "RSS 본문이 제공되지 않아 소개문만 번역했습니다. "}
            의미가 불분명하거나 건강 관련 결정을 내릴 때는 영문 원문과 전문가의
            조언을 우선해 주세요.
          </p>
        </div>
      </article>
    </>
  );
}
