"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import {
  computeResult,
  DOMAINS_IN_ORDER,
  encodeAverages,
  LIKERT_OPTIONS,
  questionsForDomain,
  TOTAL_QUESTIONS,
} from "@/application/owti";

const STORAGE_KEY = "owti-answers-v1";

type AnswerMap = Record<number, number>;

const EMPTY: AnswerMap = {};

/** Read any in-progress answers from sessionStorage (client only). */
function readStored(): AnswerMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AnswerMap;
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    /* corrupt/disabled storage — start fresh */
  }
  return {};
}

const noopSubscribe = () => () => {};

/** false during SSR + first client render, true thereafter — without seeding
 * state inside an effect (keeps react-hooks/set-state-in-effect happy). */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function OwtiQuiz() {
  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null);

  // Lazily seeded from storage so a mid-quiz refresh doesn't wipe progress.
  const [answers, setAnswers] = useState<AnswerMap>(readStored);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showIncomplete, setShowIncomplete] = useState(false);

  const hydrated = useHydrated();
  // Until hydrated, render as if empty so SSR and first client paint match;
  // restored selections appear on the post-hydration re-render.
  const view = hydrated ? answers : EMPTY;

  // Persist on change (no setState → not an effect-setState violation).
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      /* storage full/disabled — just no persistence */
    }
  }, [answers]);

  const domain = DOMAINS_IN_ORDER[step];
  const stepQuestions = useMemo(
    () => questionsForDomain(domain.key),
    [domain.key],
  );
  const isLast = step === DOMAINS_IN_ORDER.length - 1;

  const answeredTotal = Object.values(view).filter(
    (v) => v >= 1 && v <= 5,
  ).length;
  const stepComplete = stepQuestions.every((q) => Boolean(answers[q.id]));

  const setAnswer = (id: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setShowIncomplete(false);
  };

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goPrev = () => {
    if (step === 0) return;
    setShowIncomplete(false);
    setStep((s) => s - 1);
    scrollToTop();
  };

  const finish = () => {
    setSubmitting(true);
    try {
      const result = computeResult(answers);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      router.push(
        `/owti/result/${result.code}#${encodeAverages(result.scores)}`,
      );
    } catch {
      setSubmitting(false);
      setShowIncomplete(true);
    }
  };

  const goNext = () => {
    if (!stepComplete) {
      setShowIncomplete(true);
      return;
    }
    if (isLast) {
      finish();
      return;
    }
    setStep((s) => s + 1);
    scrollToTop();
  };

  const progressPct = Math.round((answeredTotal / TOTAL_QUESTIONS) * 100);

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* Progress */}
      <div className="sticky top-[57px] z-20 -mx-4 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:top-[65px] sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {step + 1}/{DOMAINS_IN_ORDER.length} · {domain.name}
          </span>
          <span className="text-muted-foreground">
            {answeredTotal}/{TOTAL_QUESTIONS} 문항
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Domain header */}
      <header className="mt-8">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          {domain.english}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          {domain.name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{domain.summary}</p>
      </header>

      {/* Scale legend */}
      <div className="mt-6 flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <span>← 전혀 아니다</span>
        <span>보통</span>
        <span>매우 그렇다 →</span>
      </div>

      {/* Questions */}
      <ol className="mt-6 space-y-6">
        {stepQuestions.map((q) => {
          const selected = view[q.id];
          return (
            <li
              key={q.id}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6"
            >
              <fieldset>
                <legend className="flex gap-2 text-base font-medium leading-relaxed text-card-foreground">
                  <span className="shrink-0 text-muted-foreground">
                    {q.id}.
                  </span>
                  <span>{q.text}</span>
                </legend>
                <div
                  role="radiogroup"
                  aria-label={q.text}
                  className="mt-4 grid grid-cols-5 gap-2"
                >
                  {LIKERT_OPTIONS.map((opt) => {
                    const active = selected === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={`${opt.value}점 - ${opt.label}`}
                        onClick={() => setAnswer(q.id, opt.value)}
                        className={[
                          "flex flex-col items-center gap-1 rounded-xl border px-1 py-3 text-center transition",
                          active
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-accent/50 hover:text-foreground",
                        ].join(" ")}
                      >
                        <span className="text-lg font-semibold leading-none">
                          {opt.value}
                        </span>
                        <span className="text-[11px] leading-tight">
                          {opt.short}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </li>
          );
        })}
      </ol>

      {showIncomplete && !stepComplete ? (
        <p
          role="alert"
          className="mt-6 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        >
          이 영역의 모든 문항에 답해야 다음으로 넘어갈 수 있어요.
        </p>
      ) : null}

      {/* Nav */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={step === 0}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          이전
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={submitting}
          className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "결과 계산 중…" : isLast ? "결과 보기" : "다음"}
        </button>
      </div>
    </div>
  );
}
