import { notFound } from "next/navigation";

import { ArticleForm } from "@/presentation/components/admin/ArticleForm";
import { submitArticleAction } from "@/presentation/actions/articles";
import { CATEGORIES } from "@/config/site";
import { articleService, categoryService } from "@/composition";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await categoryService.ensureSeeded();
  const { slug } = await params;

  const article = await articleService
    .getBySlug(slug)
    .catch(() => null);
  if (!article) notFound();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">아티클 수정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          /{article.primaryCategorySlug}/{article.slug}
        </p>
      </header>
      <ArticleForm
        initial={article}
        categories={CATEGORIES}
        defaultCategorySlug={article.primaryCategorySlug}
        action={submitArticleAction}
      />
    </div>
  );
}
