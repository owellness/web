import Link from "next/link";

import { articleService } from "@/composition";

const STATUS_LABEL: Record<string, string> = {
  draft: "초안",
  published: "발행",
  archived: "보관",
};

const formatDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(d) : "—";

export default async function AdminArticlesPage() {
  const { items } = await articleService.list(
    { status: "all" },
    { limit: 100 },
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">아티클</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            총 {items.length}개의 글
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          새 글 작성
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          아직 작성된 글이 없습니다. 첫 번째 아티클을 작성해보세요.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-left">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium">카테고리</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">업데이트</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {items.map((a) => (
                <tr key={a.id} className="transition hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/articles/${a.id}/edit`}
                      className="font-medium text-card-foreground hover:text-accent"
                    >
                      {a.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      /{a.primaryCategorySlug}/{a.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.primaryCategorySlug}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        a.status === "published"
                          ? "bg-accent/15 text-accent"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(a.updatedAt)}
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
