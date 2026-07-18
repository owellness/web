import { redirect } from "next/navigation";

import { ArticleForm } from "@/presentation/components/admin/ArticleForm";
import { submitArticleAction } from "@/presentation/actions/articles";
import { categoryService } from "@/composition";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  // Seed the four default categories on the very first admin visit so the
  // primary-category select isn't empty before any manual category exists.
  await categoryService.ensureSeeded();
  const cats = await categoryService.listAll();

  if (cats.length === 0) {
    // No DB categories at all (and seed couldn't run) — push the admin to
    // create one before authoring an article.
    redirect("/admin/categories/new?reason=need-first");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">새 아티클</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          제목·요약·본문을 작성한 뒤 발행하세요.
        </p>
      </header>
      <ArticleForm
        categories={cats}
        defaultCategorySlug={cats[0].slug}
        action={submitArticleAction}
      />
    </div>
  );
}
