import { CategoryForm } from "@/presentation/components/admin/CategoryForm";
import { createCategoryAction } from "@/presentation/actions/categories";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">새 카테고리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          공개 사이트의 카테고리 카드·내비게이션·사이트맵에 즉시 반영됩니다.
        </p>
      </header>
      {reason === "need-first" ? (
        <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
          아티클을 작성하기 전에 먼저 카테고리를 하나 만들어주세요.
        </p>
      ) : null}
      <CategoryForm action={createCategoryAction} submitLabel="추가" />
    </div>
  );
}
