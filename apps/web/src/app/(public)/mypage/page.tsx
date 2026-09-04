import type { Metadata } from "next";
import { CalendarDays, ChevronRight, History, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";

import { DOMAINS_IN_ORDER, TYPE_BY_CODE } from "@/application/owti";
import { owtiResultService } from "@/composition";
import { auth } from "@/infrastructure/auth/authConfig";
import {
  KakaoLoginButton,
  LogoutButton,
} from "@/presentation/components/public/MyPageAuthActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "마이페이지",
  description: "내 OWTI 웰니스 유형 검사 이력을 확인합니다.",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});

export default async function MyPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <section className="mx-auto flex max-w-xl flex-1 items-center px-4 py-16 sm:px-6">
        <div className="w-full rounded-3xl border border-border bg-card p-7 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <UserRound className="size-7" aria-hidden />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-card-foreground">
            나의 웰니스 기록
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            카카오로 로그인하면 내가 완료한 OWTI 검사 결과와 영역별 점수 변화를
            한곳에서 확인할 수 있어요.
          </p>
          <div className="mt-7">
            <KakaoLoginButton />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            로그인 계정 정보와 검사 결과만 저장되며 개별 기록은 다른 사용자에게
            공개되지 않습니다.
          </p>
        </div>
      </section>
    );
  }

  const history = await owtiResultService
    .history(session.user.id)
    .then((result) => result.items)
    .catch((error) => {
      console.error("[mypage] failed to load OWTI history", error);
      return null;
    });
  const displayEmail =
    session.user.email &&
    !session.user.email.endsWith("@users.noreply.owellness.kr")
      ? session.user.email
      : null;

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 pb-20 sm:px-6 sm:py-14">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">MY WELLNESS</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            마이페이지
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {session.user.name ?? "카카오 사용자"}님의 웰니스 기록이에요.
            {displayEmail ? ` · ${displayEmail}` : ""}
          </p>
        </div>
        <LogoutButton />
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <History className="size-4" aria-hidden />
            누적 검사
          </div>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-card-foreground">
            {history?.length ?? 0}
            <span className="ml-1 text-base font-normal text-muted-foreground">회</span>
          </p>
        </div>
        <Link
          href="/owti/test"
          className="group rounded-2xl border border-accent/25 bg-accent/5 p-5 transition hover:border-accent/50"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-accent">
                <Sparkles className="size-4" aria-hidden />
                OWTI 다시 검사하기
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                지금의 생활습관 변화를 새로 확인해보세요.
              </p>
            </div>
            <ChevronRight className="size-5 text-accent transition group-hover:translate-x-0.5" aria-hidden />
          </div>
        </Link>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            검사 이력
          </h2>
          <span className="text-xs text-muted-foreground">최신순</span>
        </div>

        {history === null ? (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-800 dark:text-amber-300">
            검사 이력을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </div>
        ) : history.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <Sparkles className="mx-auto size-8 text-muted-foreground" aria-hidden />
            <p className="mt-4 font-medium text-card-foreground">
              아직 저장된 검사 결과가 없어요.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              OWTI 검사를 완료하면 결과가 여기에 차곡차곡 쌓입니다.
            </p>
            <Link
              href="/owti/test"
              className="mt-5 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
            >
              첫 검사 시작하기
            </Link>
          </div>
        ) : (
          <ol className="mt-4 space-y-4">
            {history.map((item, index) => {
              const type = TYPE_BY_CODE[item.typeCode];
              const averages = DOMAINS_IN_ORDER.map(
                (domain) => item.domainAverages[domain.key] ?? 0,
              );
              const hash = averages.map((value) => value.toFixed(2)).join("-");

              return (
                <li key={item.id}>
                  <Link
                    href={`/owti/result/${item.typeCode}#${hash}`}
                    className="group block rounded-2xl border border-border bg-card p-5 transition hover:border-accent/40 hover:shadow-sm sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="text-3xl" aria-hidden>
                          {type?.emoji ?? "✨"}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-card-foreground">
                              {type?.name ?? item.typeCode}
                            </h3>
                            <span className="rounded-md bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold text-accent">
                              {item.typeCode}
                            </span>
                            {index === 0 ? (
                              <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">
                                최신
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="size-3.5" aria-hidden />
                            {dateFormatter.format(new Date(item.createdAt))}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {DOMAINS_IN_ORDER.map((domain, domainIndex) => (
                        <div key={domain.key} className="rounded-lg bg-muted/60 px-3 py-2">
                          <p className="truncate text-[11px] text-muted-foreground">
                            {domain.name}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                            {averages[domainIndex].toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </section>
  );
}
