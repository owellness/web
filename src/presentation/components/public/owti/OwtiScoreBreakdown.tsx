"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";

import {
  SCALE_MAX,
  scoresFromAverages,
  STRONG_THRESHOLD,
  weakestDomain,
} from "@/application/owti";
import { readResultAverages } from "@/presentation/lib/owtiResult";

// Threshold marker position as a % of the bar width (3.5 / 5 = 70%).
const THRESHOLD_PCT = (STRONG_THRESHOLD / SCALE_MAX) * 100;

const noopSubscribe = () => () => {};

// false during SSR + the first hydration render, true thereafter — so the
// browser-only read below never runs on the server and never causes a
// hydration mismatch. Avoids seeding state inside an effect.
function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function OwtiScoreBreakdown({ code }: { code: string }) {
  const mounted = useMounted();
  const scores = useMemo(() => {
    if (!mounted) return null; // matches the server-rendered prompt below
    const averages = readResultAverages(code);
    return averages ? scoresFromAverages(averages) : null;
  }, [mounted, code]);

  if (!scores) {
    return (
      <aside className="mt-10 rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          아직 검사를 완료하지 않으셨네요. 48문항에 답하면 나의 영역별 점수를
          확인할 수 있어요.
        </p>
        <Link
          href="/owti/test"
          className="mt-4 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
        >
          검사 시작하기
        </Link>
      </aside>
    );
  }

  const focus = weakestDomain(scores);

  return (
    <section aria-label="영역별 점수" className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        나의 영역별 점수
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        평균 {STRONG_THRESHOLD.toFixed(1)}점 이상이면 강점(●), 미만이면 취약(○)
        영역입니다.
      </p>

      <ul className="mt-6 space-y-5">
        {scores.map((s) => {
          const pct = Math.max(0, Math.min(100, (s.average / SCALE_MAX) * 100));
          return (
            <li key={s.domain.key}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {s.domain.name}
                  <span className="ml-1 text-muted-foreground">
                    {s.domain.summary}
                  </span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  <strong className="text-foreground">
                    {s.average.toFixed(1)}
                  </strong>
                  {" / 5"}
                </span>
              </div>
              <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={[
                    "h-full rounded-full transition-all",
                    s.isStrong ? "bg-accent" : "bg-amber-500/80",
                  ].join(" ")}
                  style={{ width: `${pct}%` }}
                />
                {/* 3.5 threshold marker */}
                <span
                  aria-hidden
                  className="absolute top-0 h-full border-l border-dashed border-foreground/40"
                  style={{ left: `${THRESHOLD_PCT}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                <span
                  className={[
                    "rounded-full px-2 py-0.5 font-medium",
                    s.isStrong
                      ? "bg-accent/15 text-accent"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                  ].join(" ")}
                >
                  {s.isStrong
                    ? `● ${s.domain.strong.name} (${s.letter})`
                    : `○ ${s.domain.weak.name} (${s.letter})`}
                </span>
                {s.isBorderline ? (
                  <span className="text-muted-foreground">
                    경계선 — 성장 중인 영역 (3개월 후 재진단 권장)
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          집중 영역
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          가장 점수가 낮은{" "}
          <strong>
            {focus.domain.name}({focus.domain.summary})
          </strong>{" "}
          영역부터 12주간 집중해보세요. 한 영역만 꾸준히 끌어올려도 전체 웰니스
          균형이 빠르게 달라집니다.
        </p>
      </div>
    </section>
  );
}
