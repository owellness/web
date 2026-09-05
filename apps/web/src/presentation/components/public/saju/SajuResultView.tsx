"use client";

import {
  ArrowRight,
  Check,
  Copy,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import {
  BRANCHES,
  ELEMENTS,
  getDayMasterProfile,
  STEMS,
  type ElementKey,
  type PillarKey,
  type SajuPillar,
} from "@/application/saju";
import { readSajuResult } from "@/presentation/lib/sajuStorage";

const noopSubscribe = () => () => {};

const PILLAR_LABELS: Record<PillarKey, { name: string; context: string }> = {
  year: { name: "연주", context: "뿌리" },
  month: { name: "월주", context: "계절" },
  day: { name: "일주", context: "나의 중심" },
  time: { name: "시주", context: "시간" },
};

const THEME_NUMBERS = ["01", "02", "03", "04"] as const;

function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

function PillarCard({ pillar }: { pillar: SajuPillar | null }) {
  const key = pillar?.key ?? "time";
  const label = PILLAR_LABELS[key];

  return (
    <div
      className={`rounded-2xl border p-4 text-center ${
        key === "day"
          ? "border-accent/40 bg-accent/5"
          : "border-border bg-card"
      }`}
    >
      <p className="text-xs font-medium text-muted-foreground">{label.name}</p>
      {pillar ? (
        <>
          <p className="mt-3 text-2xl font-semibold text-card-foreground">
            {STEMS[pillar.stem].hangul}
            {BRANCHES[pillar.branch].hangul}
          </p>
          <p className="mt-0.5 font-serif text-sm tracking-widest text-muted-foreground">
            {pillar.stem}
            {pillar.branch}
          </p>
        </>
      ) : (
        <>
          <p className="mt-3 text-base font-medium text-muted-foreground">미입력</p>
          <p className="mt-2 text-xs text-muted-foreground">시주 제외</p>
        </>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">{label.context}</p>
    </div>
  );
}

function elementRank(
  counts: Readonly<Record<ElementKey, number>>,
  mode: "most" | "least",
) {
  const values = ELEMENTS.map((element) => counts[element.key]);
  const target = mode === "most" ? Math.max(...values) : Math.min(...values);
  return ELEMENTS.filter((element) => counts[element.key] === target);
}

export function SajuResultView() {
  const hydrated = useHydrated();
  const result = hydrated ? readSajuResult() : null;
  const [copied, setCopied] = useState(false);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-sm text-muted-foreground sm:px-6">
        리포트를 불러오는 중…
      </div>
    );
  }

  if (!result) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-2xl">
          🌙
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
          불러올 리포트가 없어요
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          출생 정보는 서버에 저장하지 않아 새 브라우저나 새 세션에서는 다시
          입력해야 해요.
        </p>
        <Link
          href="/saju"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background"
        >
          리포트 만들기 <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    );
  }

  const profile = getDayMasterProfile(result.dayMaster);
  const dayStem = STEMS[result.dayMaster];
  const mostVisible = elementRank(result.elementCounts, "most");
  const leastVisible = elementRank(result.elementCounts, "least");
  const pillars = [
    result.pillars.year,
    result.pillars.month,
    result.pillars.day,
    result.pillars.time,
  ];

  const copySummary = async () => {
    const text = [
      `O! 리듬 — ${profile.emoji} ${profile.name}`,
      profile.tagline,
      "",
      "이번 주에 골라볼 작은 실천",
      ...profile.practices.map((practice) => `• ${practice}`),
      "",
      "전통 명리를 활용한 자기성찰 콘텐츠이며 실제 성격이나 건강 상태를 측정하지 않습니다.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <section className="border-b border-border bg-[radial-gradient(circle_at_top,_color-mix(in_oklab,var(--accent)_16%,transparent),_transparent_58%)]">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            O! Rhythm · 나의 명리 웰니스
          </p>
          <p className="mt-7 text-5xl" aria-hidden>
            {profile.emoji}
          </p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {profile.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {profile.tagline}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
            <span className="rounded-full border border-border bg-background/75 px-3 py-1.5 text-foreground">
              일간 {dayStem.hangul}({result.dayMaster})
            </span>
            <span className="rounded-full border border-border bg-background/75 px-3 py-1.5 text-foreground">
              {dayStem.polarity === "yang" ? "양" : "음"}의 {ELEMENTS.find((e) => e.key === dayStem.element)?.hangul}
            </span>
            <span className="rounded-full border border-border bg-background/75 px-3 py-1.5 text-muted-foreground">
              전통 명리 해석
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <section>
          <p className="text-sm font-semibold text-accent">나의 기본 캐릭터</p>
          <p className="mt-3 text-lg leading-8 text-foreground">
            {profile.introduction}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            이 설명이 나에게 얼마나 맞는지는 자신의 경험으로 확인해보세요. 맞지
            않는 부분은 틀린 답이 아니라 내려놓아도 되는 해석이에요.
          </p>
        </section>

        <section className="mt-14">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-accent">사주 구성 보기</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                네 기둥에 나타난 글자
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              절기 기준 · 대한민국 현지 시각 · 자정 일진 변경
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {pillars.map((pillar, index) => (
              <PillarCard key={pillar?.key ?? `missing-${index}`} pillar={pillar} />
            ))}
          </div>
          {!result.timeKnown ? (
            <p className="mt-3 rounded-xl bg-muted/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              출생 시간을 입력하지 않아 시주는 제외했습니다. 기본 캐릭터는 일주를
              기준으로 보여드려요.
            </p>
          ) : null}
          {result.termBoundaryAdjusted ? (
            <p className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              절기 전환 시각과 가까운 입력이에요. 한국 현지 시각으로 보정했지만,
              다른 만세력의 시간 기준에 따라 연주·월주가 다르게 표시될 수 있어요.
            </p>
          ) : null}
        </section>

        <section className="mt-14 rounded-[2rem] border border-border bg-card p-5 sm:p-8">
          <p className="text-sm font-semibold text-accent">오행 구성</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-card-foreground">
            팔자에 나타난 다섯 상징
          </h2>
          <div className="mt-7 space-y-5">
            {ELEMENTS.map((element) => {
              const count = result.elementCounts[element.key];
              const percentage = Math.round(
                (count / result.includedSymbols) * 100,
              );
              return (
                <div key={element.key}>
                  <div className="flex items-end justify-between gap-4 text-sm">
                    <p className="font-medium text-card-foreground">
                      {element.hangul} <span className="font-serif text-muted-foreground">{element.hanja}</span>
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {element.symbolism}
                      </span>
                    </p>
                    <p className="shrink-0 tabular-nums text-muted-foreground">
                      {count}/{result.includedSymbols}
                    </p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{ width: `${percentage}%`, backgroundColor: element.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs font-semibold text-card-foreground">
                비교적 자주 나타난 상징
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {mostVisible.map((item) => `${item.hangul}(${item.hanja})`).join(" · ")}
              </p>
            </div>
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs font-semibold text-card-foreground">
                비교적 적게 나타난 상징
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {leastVisible.map((item) => `${item.hangul}(${item.hanja})`).join(" · ")}
              </p>
            </div>
          </div>
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            천간과 지지의 대표 오행을 한 글자씩 센 단순 구성표입니다. 지장간과
            계절 가중치는 포함하지 않으며 건강 상태, 오행의 세력, 용신 또는 결핍을
            뜻하지 않아요.
          </p>
        </section>

        <section className="mt-14">
          <p className="text-sm font-semibold text-accent">나를 돌아보는 네 가지 주제</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            해석보다 내 경험을 먼저 놓아보세요
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {profile.themes.map((theme, index) => (
              <article
                key={theme.key}
                className="rounded-2xl border border-border bg-card p-5 sm:p-6"
              >
                <p className="text-xs font-semibold tracking-widest text-accent">
                  {THEME_NUMBERS[index]}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-card-foreground">
                  {theme.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {theme.insight}
                </p>
                <p className="mt-5 border-l-2 border-accent pl-3 text-sm font-medium leading-relaxed text-card-foreground">
                  {theme.question}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-[2rem] bg-foreground p-6 text-background sm:p-9">
          <div className="flex size-10 items-center justify-center rounded-full bg-background/10">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <p className="mt-5 text-sm font-medium text-background/70">
            이번 주에 골라볼 작은 실천
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            하나만 선택해도 충분해요
          </h2>
          <ul className="mt-6 space-y-3">
            {profile.practices.map((practice) => (
              <li key={practice} className="flex items-start gap-3 text-sm leading-relaxed">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-background/10">
                  <Check className="size-3" aria-hidden />
                </span>
                {practice}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-border bg-muted/40 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">이 리포트의 범위</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            전통 명리의 상징을 활용한 자기성찰 콘텐츠입니다. 실제 성격·현재 생활·건강
            상태·질환 가능성을 측정하거나 예측하지 않으며, 생활 제안은 자신의 상황과
            의료 전문가의 안내를 우선해 선택하세요.
          </p>
          <details className="mt-4 border-t border-border pt-4 text-sm">
            <summary className="cursor-pointer font-medium text-foreground">
              계산 기준 자세히 보기
            </summary>
            <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p>양력 1900년 이후, 대한민국 출생 시각을 기준으로 계산합니다.</p>
              <p>
                연주와 월주는 절기 전환을 사용하고 Asia/Seoul의 역사적 UTC 오프셋을
                반영합니다. 일주는 현지 자정에 바뀌는 방식으로 계산합니다.
              </p>
              <p>
                명식 계산에는 lunar-javascript 1.7.7을 사용했습니다. 해외 출생,
                음력 입력, 지역에 따른 태양시 보정은 아직 지원하지 않습니다.
              </p>
            </div>
          </details>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => void copySummary()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "복사했어요" : "개인정보 없이 결과 복사"}
          </button>
          <Link
            href="/saju"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <RefreshCw className="size-4" aria-hidden /> 다시 입력하기
          </Link>
          <Link
            href="/owti"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground transition hover:opacity-90"
          >
            현재 생활도 알아보기 <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </main>
    </>
  );
}
