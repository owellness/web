import Link from "next/link";

import { DOMAINS_IN_ORDER, TYPE_BY_CODE } from "@/application/owti";
import {
  OWTI_STATS_PERIODS,
  type OwtiStats,
  parseStatsPeriod,
} from "@/application/owtiAnalytics/model";
import { owtiAnalyticsService } from "@/composition";

export const dynamic = "force-dynamic";

const EMPTY_STATS: OwtiStats = {
  funnel: { started: 0, step1: 0, step2: 0, step3: 0, completed: 0 },
  typeCounts: [],
  totalCompletions: 0,
};

const ko = (n: number) => n.toLocaleString("ko-KR");
const ratio = (value: number, base: number) =>
  base > 0 ? (value / base) * 100 : 0;
const ratioLabel = (value: number, base: number) =>
  base > 0 ? `${(Math.round(ratio(value, base) * 10) / 10).toString()}%` : "—";

export default async function AdminOwtiStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period = parseStatsPeriod(rawPeriod);
  const stats = await owtiAnalyticsService
    .stats(period)
    .catch(() => EMPTY_STATS);

  const f = stats.funnel;
  const base = f.started;
  const total = stats.totalCompletions;

  const stages = [
    { label: "첫 접속", sub: "검사 시작", value: f.started },
    { label: "1단계 완료", sub: DOMAINS_IN_ORDER[0].name, value: f.step1 },
    { label: "2단계 완료", sub: DOMAINS_IN_ORDER[1].name, value: f.step2 },
    { label: "3단계 완료", sub: DOMAINS_IN_ORDER[2].name, value: f.step3 },
    { label: "검사 완료", sub: DOMAINS_IN_ORDER[3].name, value: f.completed },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            웰니스 검사 통계
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            OWTI 검사 퍼널과 완료 유형 분포 (익명 집계)
          </p>
        </div>
        <nav className="flex gap-1 rounded-full border border-border bg-card p-1 text-sm">
          {OWTI_STATS_PERIODS.map((p) => (
            <Link
              key={p.value}
              href={`/admin/owti?period=${p.value}`}
              className={[
                "rounded-full px-3 py-1.5 transition",
                p.value === period
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")}
            >
              {p.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["첫 접속자", ko(f.started)],
            ["완료자", ko(f.completed)],
            ["완료율", ratioLabel(f.completed, base)],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-card-foreground">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground">
          단계별 퍼널
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          첫 접속 대비 각 단계 도달 비율과 단계별 이탈 인원입니다.
        </p>
        <ol className="mt-6 space-y-4">
          {stages.map((s, i) => {
            const prev = i > 0 ? stages[i - 1].value : null;
            const drop = prev !== null ? prev - s.value : null;
            return (
              <li key={s.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">
                    {s.label}
                    <span className="ml-2 text-muted-foreground">{s.sub}</span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    <strong className="text-foreground">{ko(s.value)}</strong>명
                    · {ratioLabel(s.value, base)}
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${ratio(s.value, base)}%` }}
                  />
                </div>
                {drop !== null && drop > 0 && prev ? (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                    이전 단계에서 {ko(drop)}명 이탈 ({ratioLabel(drop, prev)})
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Type distribution */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">
            완료자 유형 분포
          </h2>
          <span className="text-sm text-muted-foreground">총 {ko(total)}건</span>
        </div>
        {stats.typeCounts.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            아직 완료된 검사가 없습니다.
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {stats.typeCounts.map((tc) => {
              const type = TYPE_BY_CODE[tc.code];
              return (
                <li key={tc.code} className="flex items-center gap-3">
                  <span className="w-7 shrink-0 text-center text-xl" aria-hidden>
                    {type?.emoji ?? "•"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-foreground">
                        <span className="font-mono text-xs text-muted-foreground">
                          {tc.code}
                        </span>{" "}
                        {type?.name ?? tc.code}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {ko(tc.count)}건 · {ratioLabel(tc.count, total)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${ratio(tc.count, total)}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
