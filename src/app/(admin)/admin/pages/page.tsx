import Link from "next/link";

import { pageService } from "@/composition";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  await pageService.ensureSeeded().catch(() => {});
  const rows = await pageService.listAll().catch(() => []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">페이지</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          소개 등 고정 페이지의 제목·본문·SEO를 수정합니다.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          편집할 수 있는 페이지가 아직 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium">공개 URL</th>
                <th className="px-4 py-3 font-medium text-right">동작</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((page) => (
                <tr key={page.id} className="align-top transition hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pages/${page.slug}/edit`}
                      className="font-medium text-card-foreground hover:text-accent"
                    >
                      {page.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    /{page.slug}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Link
                        href={`/admin/pages/${page.slug}/edit`}
                        className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:bg-muted"
                      >
                        수정
                      </Link>
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
