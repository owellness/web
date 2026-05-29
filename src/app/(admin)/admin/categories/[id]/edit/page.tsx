import { notFound } from "next/navigation";

import { CategoryForm } from "@/presentation/components/admin/CategoryForm";
import { updateCategoryAction } from "@/presentation/actions/categories";
import { categoryService } from "@/composition";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cat = await categoryService.findById(id).catch(() => null);
  if (!cat) notFound();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">카테고리 수정</h1>
        <p className="mt-1 text-sm text-muted-foreground">/{cat.slug}</p>
      </header>
      <CategoryForm
        initial={cat}
        action={updateCategoryAction}
        submitLabel="저장"
      />
    </div>
  );
}
