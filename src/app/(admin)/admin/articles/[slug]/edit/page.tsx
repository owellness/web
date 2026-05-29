import { notFound } from "next/navigation";

import { ApplicationError } from "@/application/shared/errors";
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

  // Only a genuine "not found" should 404. Real DB errors must surface (500 +
  // logs) rather than be masked as a misleading "page not found".
  let article;
  try {
    article = await articleService.getBySlug(slug);
  } catch (e) {
    if (e instanceof ApplicationError && e.code === "NOT_FOUND") {
      notFound();
    }
    throw e;
  }

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
