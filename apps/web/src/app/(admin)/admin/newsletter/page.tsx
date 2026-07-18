import { CampaignComposer } from "@/presentation/components/admin/CampaignComposer";
import {
  broadcastCampaignAction,
  sendTestCampaignAction,
} from "@/presentation/actions/campaigns";
import { auth } from "@/infrastructure/auth/authConfig";
import { newsletterService } from "@/composition";

export const dynamic = "force-dynamic";
// Broadcasts send Resend batches sequentially; give the server action room.
export const maxDuration = 60;

const STATUS_LABEL: Record<string, string> = {
  draft: "초안",
  sending: "발송 중",
  sent: "발송 완료",
  failed: "실패",
};

const STATUS_TONE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sending: "bg-muted text-muted-foreground",
  sent: "bg-accent/15 text-accent",
  failed: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

const formatDateTime = (d: Date | null) =>
  d
    ? new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d)
    : "—";

export default async function AdminNewsletterPage() {
  const session = await auth();
  const [confirmedCount, campaigns] = await Promise.all([
    newsletterService.confirmedCount().catch(() => 0),
    newsletterService.listCampaigns(50).catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">뉴스레터 발송</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          확인 완료 구독자 {confirmedCount.toLocaleString("ko-KR")}명 대상.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <CampaignComposer
          confirmedCount={confirmedCount}
          defaultTestEmail={session?.user?.email ?? ""}
          testAction={sendTestCampaignAction}
          broadcastAction={broadcastCampaignAction}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          발송 이력
        </h2>
        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            아직 발송한 뉴스레터가 없습니다.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">제목</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">발송</th>
                  <th className="px-4 py-3 font-medium">일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((c) => (
                  <tr key={c.id} className="align-top">
                    <td className="px-4 py-3 font-medium text-card-foreground">
                      {c.subject}
                      {c.error ? (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {c.error}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${STATUS_TONE[c.status]}`}
                      >
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.sentCount}/{c.recipientCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(c.sentAt ?? c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
