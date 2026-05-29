import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicationError } from "@/application/shared/errors";
import { extractFaqFromHtml } from "@/application/seo/faqExtractor";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from "@/application/seo/jsonld";
import {
  CATEGORY_BY_SLUG,
  SITE_CONFIG,
  SITE_NAME,
  SITE_URL,
  type CategorySlug,
} from "@/config/site";
import { JsonLd } from "@/presentation/components/public/JsonLd";
import { MedicalDisclaimer } from "@/presentation/components/public/MedicalDisclaimer";

import { articleService } from "@/composition";

export const revalidate = 300;
export const dynamicParams = true;

const formatDate = (date: Date | null) =>
  date
    ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(date)
    : "";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  if (!(category in CATEGORY_BY_SLUG)) return {};

  try {
    const article = await articleService.getBySlug(slug);
    if (article.primaryCategorySlug !== category) return {};

    const title = article.seoTitle ?? article.title;
    const description = article.seoDescription ?? article.excerpt;
    const url = `${SITE_URL}/${article.primaryCategorySlug}/${article.slug}`;
    return {
      title,
      description,
      alternates: { canonical: article.canonicalUrl ?? url },
      openGraph: {
        type: "article",
        url,
        title,
        description,
        siteName: SITE_NAME,
        images: [article.ogImageUrl ?? SITE_CONFIG.defaultOgImage],
        publishedTime: article.publishedAt?.toISOString(),
        modifiedTime: article.updatedAt.toISOString(),
        authors: [article.authorName],
        tags: article.tags.map((t) => t.name),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [article.ogImageUrl ?? SITE_CONFIG.defaultOgImage],
      },
    };
  } catch {
    return {};
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  if (!(category in CATEGORY_BY_SLUG)) notFound();

  let article;
  try {
    article = await articleService.getBySlug(slug);
  } catch (e) {
    if (e instanceof ApplicationError && e.code === "NOT_FOUND") {
      // TEMP diagnostic: dump the queried slug and the slugs actually stored,
      // with code points, to pinpoint the mismatch.
      const cp = (s: string) =>
        Array.from(s)
          .map((c) => c.codePointAt(0)?.toString(16))
          .join(",");
      const stored = await articleService
        .list({ status: "all" }, { limit: 20 })
        .then((r) =>
          r.items.map((a) => `${a.primaryCategorySlug}/${a.slug}[${cp(a.slug)}]`),
        )
        .catch(() => ["<list failed>"]);
      console.warn(
        `[article] notFound. queried category=${category} slug=${JSON.stringify(slug)} cp=[${cp(slug)}] | stored=${JSON.stringify(stored)}`,
      );
      notFound();
    }
    throw e;
  }
  if (article.primaryCategorySlug !== category) {
    console.warn(
      `[article] notFound: category mismatch. urlCategory=${category} articleCategory=${article.primaryCategorySlug} slug=${slug}`,
    );
    notFound();
  }
  if (article.status !== "published") {
    console.warn(
      `[article] notFound: not published. status=${article.status} slug=${slug}`,
    );
    notFound();
  }

  const cat = CATEGORY_BY_SLUG[category as CategorySlug];
  const articleUrl = `${SITE_URL}/${article.primaryCategorySlug}/${article.slug}`;

  const isMedical = article.medicalReviewer !== null;
  const speakableSelectors: string[] = [];
  if (article.tldr.length > 0) speakableSelectors.push(".speakable");
  speakableSelectors.push("article h1");

  const articleSchema = buildArticleJsonLd({
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.excerpt,
    url: articleUrl,
    imageUrl: article.ogImageUrl,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    author: {
      name: article.authorName,
      url: `${SITE_URL}/authors/${article.authorSlug}`,
    },
    publisher: {
      name: SITE_CONFIG.legalName,
      url: SITE_URL,
      logoUrl: `${SITE_URL}/logo.png`,
    },
    isMedical,
    reviewedBy: article.medicalReviewer
      ? {
          name: article.medicalReviewer.name,
          url: `${SITE_URL}/authors/${article.medicalReviewer.slug}`,
        }
      : null,
    speakableSelectors,
  });

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: SITE_NAME, url: SITE_URL },
    { name: cat.name, url: `${SITE_URL}/${cat.slug}` },
    { name: article.title, url: articleUrl },
  ]);

  const faqPairs = extractFaqFromHtml(article.contentHtml);
  const faqSchema =
    faqPairs.length >= 2
      ? buildFaqJsonLd(
          faqPairs.map((p) => ({ question: p.question, answerHtml: p.answer })),
        )
      : null;

  return (
    <>
      <JsonLd schema={articleSchema} />
      <JsonLd schema={breadcrumb} />
      {faqSchema ? <JsonLd schema={faqSchema} /> : null}

      <article className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6">
        <nav
          aria-label="breadcrumb"
          className="mb-6 text-sm text-muted-foreground"
        >
          <Link href="/" className="hover:text-foreground">
            홈
          </Link>
          <span aria-hidden> · </span>
          <Link
            href={`/${cat.slug}`}
            className="hover:text-foreground"
          >
            {cat.shortName}
          </Link>
        </nav>

        <header className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            {cat.name}
          </p>
          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground">
            {article.title}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {article.excerpt}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-4 text-sm text-muted-foreground">
            <span>
              by{" "}
              <Link
                href={`/authors/${article.authorSlug}`}
                className="font-medium text-foreground hover:text-accent"
              >
                {article.authorName}
              </Link>
            </span>
            {article.publishedAt ? (
              <time dateTime={article.publishedAt.toISOString()}>
                {formatDate(article.publishedAt)}
              </time>
            ) : null}
            <span>· {Math.max(1, Math.round(article.readingTimeSec / 60))}분 읽기</span>
            {article.medicalReviewer ? (
              <span>
                · 의료 검토: <strong>{article.medicalReviewer.name}</strong>
              </span>
            ) : null}
          </div>
        </header>

        {article.tldr.length > 0 ? (
          <aside
            aria-label="요약"
            className="speakable my-10 rounded-2xl border border-accent/20 bg-accent/5 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              TL;DR
            </p>
            <ul className="mt-3 space-y-2 text-base leading-relaxed text-foreground">
              {article.tldr.map((line, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-1 text-accent" aria-hidden>
                    •
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}

        <div
          className="prose-article mt-10 leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />

        {article.tags.length > 0 ? (
          <ul className="mt-12 flex flex-wrap gap-2 border-t border-border pt-6 text-sm text-muted-foreground">
            {article.tags.map((tag) => (
              <li
                key={tag.slug}
                className="rounded-full border border-border px-3 py-1"
              >
                #{tag.name}
              </li>
            ))}
          </ul>
        ) : null}

        {isMedical ? <MedicalDisclaimer /> : null}
      </article>
    </>
  );
}
