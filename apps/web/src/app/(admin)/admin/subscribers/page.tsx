import { newsletterService } from "@/composition";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "확인 대기",
  confirmed: "확인 완료",
  unsubscribed: "해지",
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-accent/15 text-accent",
  unsubscribed:
    "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

const formatDateTime = (d: Date | null) =>
  d
    ? new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d)
    : "—";

export default async function AdminSubscribersPage() {
  const [items, counts] = await Promise.all([
    newsletterService.listRecent(200).catch(() => []),
    newsletterService
      .statusCounts()
      .catch(() => ({ pending: 0, confirmed: 0, unsubscribed: 0 })),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">뉴스레터 구독자</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          최근 구독 {items.length}건 (최대 200건)
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["confirmed", "확인 완료"],
            ["pending", "확인 대기"],
            ["unsubscribed", "해지"],
          ] as const
        ).map(([key, label]) => (
          <div
            key={key}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-card-foreground">
              {counts[key].toLocaleString("ko-KR")}
            </p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          아직 구독자가 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">유입</th>
                <th className="px-4 py-3 font-medium">신청</th>
                <th className="px-4 py-3 font-medium">확인</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((s) => (
                <tr key={s.id} className="transition hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-card-foreground">
                    {s.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${STATUS_TONE[s.status]}`}
                    >
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.source ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(s.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(s.confirmedAt)}
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
