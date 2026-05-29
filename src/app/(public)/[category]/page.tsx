import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildBreadcrumbJsonLd } from "@/application/seo/jsonld";
import { articleService, categoryService } from "@/composition";
import { SITE_CONFIG, SITE_NAME, SITE_URL } from "@/config/site";
import { ArticleCard } from "@/presentation/components/public/ArticleCard";
import { JsonLd } from "@/presentation/components/public/JsonLd";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const cats = await categoryService.listAll().catch(() => []);
  return cats.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = await categoryService.findBySlug(category).catch(() => null);
  if (!cat) return {};
  const title = cat.seoTitle ?? `${cat.name} | ${SITE_NAME}`;
  const description = cat.seoDescription ?? cat.description;
  const url = `${SITE_URL}/${cat.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: SITE_NAME,
      images: [SITE_CONFIG.defaultOgImage],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = await categoryService.findBySlug(category).catch(() => null);
  if (!cat) notFound();

  // Resilient to DB unavailability during build (placeholder URL) — first real
  // request after ISR revalidation will repopulate.
  const { items } = await articleService
    .list({ categorySlug: cat.slug, status: "published" }, { limit: 24 })
    .catch((error) => {
      console.warn(`[category:${cat.slug}] DB unavailable:`, error);
      return { items: [], nextCursor: null };
    });

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: SITE_NAME, url: SITE_URL },
    { name: cat.name, url: `${SITE_URL}/${cat.slug}` },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumb} />
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            {cat.name}
          </h1>
          {cat.description ? (
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              {cat.description}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
            아직 발행된 아티클이 없습니다. 새 콘텐츠를 준비 중이에요.
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
