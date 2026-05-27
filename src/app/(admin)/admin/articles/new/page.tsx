import { ArticleForm } from "@/presentation/components/admin/ArticleForm";
import { submitArticleAction } from "@/presentation/actions/articles";
import { CATEGORIES } from "@/config/site";
import { categoryService } from "@/composition";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  // Make sure the four categories exist so the form's primary category select
  // resolves to a valid FK on save.
  await categoryService.ensureSeeded();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">새 아티클</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          제목·요약·본문을 작성한 뒤 발행하세요.
        </p>
      </header>
      <ArticleForm
        categories={CATEGORIES}
        defaultCategorySlug={CATEGORIES[0].slug}
        action={submitArticleAction}
      />
    </div>
  );
}
