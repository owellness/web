import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicationError } from "@/application/shared/errors";
import { buildBodyExcerpt } from "@/application/seo/articleMeta";
import { extractFaqFromHtml } from "@/application/seo/faqExtractor";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from "@/application/seo/jsonld";
import { SITE_CONFIG, SITE_NAME, SITE_URL } from "@/config/site";
import { ArticleViewTracker } from "@/presentation/components/public/ArticleViewTracker";
import { JsonLd } from "@/presentation/components/public/JsonLd";
import { MedicalDisclaimer } from "@/presentation/components/public/MedicalDisclaimer";
import { NewsletterCTA } from "@/presentation/components/public/NewsletterCTA";
import { resolveDefaultOgImage } from "@/presentation/lib/siteSettings";

import { articleService, authorService, categoryService } from "@/composition";

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
  const catExists = await categoryService
    .findBySlug(category)
    .catch(() => null);
  if (!catExists) return {};

  try {
    const article = await articleService.getBySlug(slug);
    if (article.primaryCategorySlug !== category) return {};

    const title = article.seoTitle ?? article.title;
    // `??` only falls back on null/undefined — empty/whitespace strings would
    // slip through and produce a blank og:description. Trim to null first.
    const blankToNull = (s?: string | null) =>
      s && s.trim().length > 0 ? s.trim() : null;
    const bodyExcerpt = blankToNull(buildBodyExcerpt(article.contentHtml));

    // Page <meta description>: curated excerpt for search snippets.
    const metaDescription =
      blankToNull(article.seoDescription) ??
      blankToNull(article.excerpt) ??
      SITE_CONFIG.description;
    // Social (OG/Twitter) description: prefer the article body so shared cards
    // show real content; fall back to SEO description / excerpt.
    const ogDescription =
      bodyExcerpt ??
      blankToNull(article.seoDescription) ??
      blankToNull(article.excerpt) ??
      SITE_CONFIG.description;
    const url = `${SITE_URL}/${article.primaryCategorySlug}/${article.slug}`;
    // Per-article image wins; otherwise the admin-set (or bundled) site default.
    const ogImage = article.ogImageUrl ?? (await resolveDefaultOgImage());
    return {
      title,
      description: metaDescription,
      alternates: { canonical: article.canonicalUrl ?? url },
      openGraph: {
        type: "article",
        url,
        title,
        description: ogDescription,
        siteName: SITE_NAME,
        images: [ogImage],
        publishedTime: article.publishedAt?.toISOString(),
        modifiedTime: article.updatedAt.toISOString(),
        authors: [article.authorName],
        tags: article.tags.map((t) => t.name),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: ogDescription,
        images: [ogImage],
      },
    };
  } catch (e) {
    console.warn("[article generateMetadata] falling back to defaults:", e);
    return {};
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const cat = await categoryService.findBySlug(category).catch(() => null);
  if (!cat) notFound();

  let article;
  try {
    article = await articleService.getBySlug(slug);
  } catch (e) {
    // Genuine "not found" → 404. Real DB errors must surface (500 + logs)
    // rather than be masked as a misleading "page not found".
    if (e instanceof ApplicationError && e.code === "NOT_FOUND") {
      notFound();
    }
    throw e;
  }
  if (article.primaryCategorySlug !== category) notFound();
  if (article.status !== "published") notFound();

  // Keep the article byline in sync with the public author profile. If the
  // profile lookup is temporarily unavailable, the article itself can still
  // render with the author name already included in the article record.
  const author = await authorService
    .findBySlug(article.authorSlug)
    .catch(() => null);

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
      <ArticleViewTracker slug={article.slug} />
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
            {cat.name}
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
          <div className="border-y border-border py-5">
            <div className="flex items-start gap-4">
              <Link
                href={`/authors/${article.authorSlug}`}
                aria-label={`${article.authorName} 저자 프로필 보기`}
                className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {author?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={author.avatarUrl}
                    alt={article.authorName}
                    className="size-16 rounded-full border border-border object-cover"
                  />
                ) : (
                  <span className="flex size-16 items-center justify-center rounded-full border border-border bg-muted text-lg font-semibold text-muted-foreground">
                    {article.authorName.charAt(0)}
                  </span>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  작성자
                </p>
                <Link
                  href={`/authors/${article.authorSlug}`}
                  className="mt-0.5 inline-block font-semibold text-foreground hover:text-accent"
                >
                  {article.authorName}
                </Link>
                {author?.credentials || author?.affiliation ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[author.credentials, author.affiliation]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
                {author?.bio ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {author.bio}
                  </p>
                ) : null}
                <Link
                  href={`/authors/${article.authorSlug}`}
                  className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
                >
                  프로필과 작성 글 보기 →
                </Link>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-4 text-sm text-muted-foreground">
              {article.publishedAt ? (
                <time dateTime={article.publishedAt.toISOString()}>
                  {formatDate(article.publishedAt)}
                </time>
              ) : null}
              <span>
                · {Math.max(1, Math.round(article.readingTimeSec / 60))}분 읽기
              </span>
              {article.medicalReviewer ? (
                <span>
                  · 의료 검토: <strong>{article.medicalReviewer.name}</strong>
                </span>
              ) : null}
            </div>
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

        <NewsletterCTA />

        {isMedical ? <MedicalDisclaimer /> : null}
      </article>
    </>
  );
}
