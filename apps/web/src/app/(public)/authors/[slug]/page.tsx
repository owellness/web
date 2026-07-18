import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  buildBreadcrumbJsonLd,
  buildPersonJsonLd,
} from "@/application/seo/jsonld";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { ArticleCard } from "@/presentation/components/public/ArticleCard";
import { JsonLd } from "@/presentation/components/public/JsonLd";

import { articleService, authorService } from "@/composition";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = await authorService.findBySlug(slug).catch(() => null);
  if (!author) return {};
  const title = `${author.displayName} | 저자`;
  const description =
    author.bio?.trim() ||
    `${author.displayName} 저자가 ${SITE_NAME}에 기여한 콘텐츠를 모았습니다.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/authors/${author.slug}` },
    openGraph: {
      title,
      description,
      type: "profile",
      images: author.avatarUrl ? [author.avatarUrl] : undefined,
    },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = await authorService.findBySlug(slug).catch(() => null);
  if (!author) notFound();

  const { items } = await articleService
    .list({ authorSlug: author.slug, status: "published" }, { limit: 48 })
    .catch(() => ({ items: [], nextCursor: null }));

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: SITE_NAME, url: SITE_URL },
    {
      name: author.displayName,
      url: `${SITE_URL}/authors/${author.slug}`,
    },
  ]);

  const personSchema = buildPersonJsonLd({
    name: author.displayName,
    url: `${SITE_URL}/authors/${author.slug}`,
    bio: author.bio || "",
    avatarUrl: author.avatarUrl,
    affiliation: author.affiliation,
    sameAs: Object.values(author.social).filter(Boolean),
  });

  return (
    <>
      <JsonLd schema={breadcrumb} />
      <JsonLd schema={personSchema} />
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <nav
            aria-label="breadcrumb"
            className="mb-3 text-sm text-muted-foreground"
          >
            <Link href="/" className="hover:text-foreground">
              홈
            </Link>
          </nav>
          <div className="flex items-start gap-5">
            {author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={author.avatarUrl}
                alt={author.displayName}
                className="size-16 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full border border-border bg-muted text-lg font-semibold text-muted-foreground">
                {author.displayName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {author.displayName}
              </h1>
              {author.credentials ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {author.credentials}
                  {author.affiliation ? ` · ${author.affiliation}` : ""}
                </p>
              ) : author.affiliation ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {author.affiliation}
                </p>
              ) : null}
              {author.bio ? (
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {author.bio}
                </p>
              ) : null}
              {author.websiteUrl ? (
                <a
                  href={author.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
                >
                  웹사이트
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 text-xl font-semibold tracking-tight text-foreground">
          {author.displayName}의 콘텐츠
        </h2>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
            아직 발행된 콘텐츠가 없습니다.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
