import Link from "next/link";

import { categoryService } from "@/composition";
import { DeleteCategoryButton } from "@/presentation/components/admin/DeleteCategoryButton";
import { deleteCategoryAction } from "@/presentation/actions/categories";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  "has-articles":
    "이 카테고리에 속한 아티클이 있어 삭제할 수 없습니다. 먼저 아티클을 다른 카테고리로 옮기거나 삭제해주세요.",
};

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await categoryService.ensureSeeded();
  const { error } = await searchParams;
  const rows = await categoryService.listAll().catch(() => []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">카테고리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            총 {rows.length}개 · 공개 URL은 <code>/{"{슬러그}"}</code> 형태입니다.
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          새 카테고리
        </Link>
      </header>

      {error && ERROR_MESSAGES[error] ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {ERROR_MESSAGES[error]}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          아직 카테고리가 없습니다. 새 카테고리를 추가해보세요.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">슬러그</th>
                <th className="px-4 py-3 font-medium">설명</th>
                <th className="px-4 py-3 font-medium text-right">동작</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((cat) => (
                <tr key={cat.id} className="align-top transition hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/categories/${cat.id}/edit`}
                      className="font-medium text-card-foreground hover:text-accent"
                    >
                      {cat.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    /{cat.slug}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground line-clamp-2 max-w-md">
                    {cat.description || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/categories/${cat.id}/edit`}
                        className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:bg-muted"
                      >
                        수정
                      </Link>
                      <DeleteCategoryButton
                        id={cat.id}
                        name={cat.name}
                        action={deleteCategoryAction}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
