import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buildBreadcrumbJsonLd } from "@/application/seo/jsonld";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { ArticleCard } from "@/presentation/components/public/ArticleCard";
import { JsonLd } from "@/presentation/components/public/JsonLd";

import { articleService, tagService } from "@/composition";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await tagService.findBySlug(slug).catch(() => null);
  if (!tag) return {};
  const title = `#${tag.name}`;
  const description = `${tag.name} 태그가 붙은 ${SITE_NAME} 콘텐츠를 모았습니다.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/tags/${tag.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await tagService.findBySlug(slug).catch(() => null);
  if (!tag) notFound();

  const { items } = await articleService
    .list({ tagSlug: tag.slug, status: "published" }, { limit: 48 })
    .catch(() => ({ items: [], nextCursor: null }));

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: SITE_NAME, url: SITE_URL },
    { name: `#${tag.name}`, url: `${SITE_URL}/tags/${tag.slug}` },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumb} />
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <nav
            aria-label="breadcrumb"
            className="mb-3 text-sm text-muted-foreground"
          >
            <Link href="/" className="hover:text-foreground">
              홈
            </Link>
          </nav>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            #{tag.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            태그 ‘{tag.name}’가 붙은 {items.length}개의 아티클
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
            이 태그의 콘텐츠가 아직 없습니다.
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
