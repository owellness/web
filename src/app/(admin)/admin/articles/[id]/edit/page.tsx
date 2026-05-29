import { notFound } from "next/navigation";

import { ApplicationError } from "@/application/shared/errors";
import { ArticleForm } from "@/presentation/components/admin/ArticleForm";
import { DeleteArticleButton } from "@/presentation/components/admin/DeleteArticleButton";
import {
  deleteArticleAction,
  submitArticleAction,
} from "@/presentation/actions/articles";
import { CATEGORIES } from "@/config/site";
import { articleService, categoryService } from "@/composition";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await categoryService.ensureSeeded();
  const { id } = await params;

  // Admin edits by article ID (UUID) — stable and free of slug-encoding
  // pitfalls. Only a genuine "not found" should 404; real DB errors surface
  // as 500 + logs rather than a misleading "page not found".
  let article;
  try {
    article = await articleService.getById(id);
  } catch (e) {
    if (e instanceof ApplicationError && e.code === "NOT_FOUND") {
      notFound();
    }
    throw e;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">아티클 수정</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            /{article.primaryCategorySlug}/{article.slug}
          </p>
        </div>
        <DeleteArticleButton id={article.id} action={deleteArticleAction} />
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
