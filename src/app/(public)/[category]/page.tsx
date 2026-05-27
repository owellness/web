import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildBreadcrumbJsonLd } from "@/application/seo/jsonld";
import { CATEGORY_BY_SLUG, CATEGORIES, SITE_CONFIG, SITE_NAME, SITE_URL, type CategorySlug } from "@/config/site";
import { ArticleCard } from "@/presentation/components/public/ArticleCard";
import { JsonLd } from "@/presentation/components/public/JsonLd";

import { articleService } from "@/composition";

export const revalidate = 300;

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

const resolveCategory = (slug: string) => {
  if (!(slug in CATEGORY_BY_SLUG)) return null;
  return CATEGORY_BY_SLUG[slug as CategorySlug];
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = resolveCategory(category);
  if (!cat) return {};
  const title = `${cat.name} | ${SITE_NAME}`;
  const description = cat.description;
  const url = `${SITE_URL}/${cat.slug}`;
  return {
    title,
    description,
    keywords: cat.keywords,
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
  const cat = resolveCategory(category);
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
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            {cat.shortName}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
            {cat.name}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {cat.description}
          </p>
          <ul className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {cat.keywords.map((kw) => (
              <li
                key={kw}
                className="rounded-full border border-border px-3 py-1"
              >
                #{kw}
              </li>
            ))}
          </ul>
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
