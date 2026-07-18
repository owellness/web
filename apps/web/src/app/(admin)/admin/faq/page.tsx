import Link from "next/link";

import { faqService } from "@/composition";
import { DeleteFaqItemButton } from "@/presentation/components/admin/DeleteFaqItemButton";
import { deleteFaqItemAction } from "@/presentation/actions/faq";

export const dynamic = "force-dynamic";

export default async function AdminFaqPage() {
  await faqService.ensureSeeded().catch(() => {});
  const rows = await faqService.listAll().catch(() => []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">자주 묻는 질문</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            총 {rows.length}개 · 공개 페이지는 <code>/faq</code> 입니다.
          </p>
        </div>
        <Link
          href="/admin/faq/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          새 FAQ
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          아직 FAQ가 없습니다. 새 질문을 추가해보세요.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">순서</th>
                <th className="px-4 py-3 font-medium">질문</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">동작</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((item) => (
                <tr key={item.id} className="align-top transition hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {item.position}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/faq/${item.id}/edit`}
                      className="font-medium text-card-foreground hover:text-accent"
                    >
                      {item.question}
                    </Link>
                    <p className="mt-1 line-clamp-2 max-w-xl text-xs text-muted-foreground">
                      {item.answer}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {item.isPublished ? (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                        공개
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        비공개
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/faq/${item.id}/edit`}
                        className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:bg-muted"
                      >
                        수정
                      </Link>
                      <DeleteFaqItemButton
                        id={item.id}
                        question={item.question}
                        action={deleteFaqItemAction}
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
