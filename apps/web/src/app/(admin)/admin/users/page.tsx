import { registeredUserService } from "@/composition";

export const dynamic = "force-dynamic";

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);

const providerLabel = (provider: string) => {
  if (provider === "kakao") return "카카오";
  return provider;
};

const isSyntheticEmail = (email: string) =>
  email.endsWith("@users.noreply.owellness.kr");

export default async function AdminUsersPage() {
  const [items, total] = await Promise.all([
    registeredUserService.listRecent(200).catch(() => []),
    registeredUserService.count().catch(() => 0),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">가입자</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          서비스 계정으로 가입한 회원을 확인합니다.
        </p>
      </header>

      <div className="max-w-sm rounded-2xl border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          전체 가입자
        </p>
        <p className="mt-1 text-2xl font-semibold text-card-foreground">
          {total.toLocaleString("ko-KR")}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          아직 가입자가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-2xl text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">닉네임</th>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium">가입 방식</th>
                <th className="px-4 py-3 font-medium">가입일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((user) => (
                <tr key={user.id} className="transition hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-card-foreground">
                    {user.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {isSyntheticEmail(user.email) ? "미제공" : user.email}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {user.providers.map((provider) => (
                        <span
                          key={provider}
                          className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-200"
                        >
                          {providerLabel(provider)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDateTime(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > items.length ? (
        <p className="text-right text-xs text-muted-foreground">
          최근 가입자 {items.length.toLocaleString("ko-KR")}명까지 표시합니다.
        </p>
      ) : null}
    </div>
  );
}
