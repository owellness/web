"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import {
  computeResult,
  DOMAINS_IN_ORDER,
  encodeAverages,
  LIKERT_OPTIONS,
  questionsForDomain,
  RESULT_STORAGE_KEY,
  TOTAL_QUESTIONS,
} from "@/application/owti";
import { trackOwtiEvent } from "@/presentation/lib/owtiTracking";
import {
  OWTI_ANSWERS_STORAGE_KEY,
  OWTI_RESULT_PENDING_STORAGE_KEY,
} from "@/presentation/lib/owtiStorage";

const STARTED_KEY = "owti-started";

type AnswerMap = Record<number, number>;

const EMPTY: AnswerMap = {};

/** Read any in-progress answers from sessionStorage (client only). */
function readStored(): AnswerMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(OWTI_ANSWERS_STORAGE_KEY);
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

export function OwtiQuiz({
  isAuthenticated,
  resumeAtLastStep = false,
}: {
  isAuthenticated: boolean;
  resumeAtLastStep?: boolean;
}) {
  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null);

  // Lazily seeded from storage so a mid-quiz refresh doesn't wipe progress.
  const [answers, setAnswers] = useState<AnswerMap>(readStored);
  const [step, setStep] = useState(
    resumeAtLastStep ? DOMAINS_IN_ORDER.length - 1 : 0,
  );
  const [submitting, setSubmitting] = useState(false);
  const [showIncomplete, setShowIncomplete] = useState(false);

  const hydrated = useHydrated();
  // Until hydrated, render as if empty so SSR and first client paint match;
  // restored selections appear on the post-hydration re-render.
  const view = hydrated ? answers : EMPTY;

  // Funnel: record "started the assessment" once per browser session.
  const startedRef = useRef(false);
  // Dedup advance beacons if the user steps back and forth.
  const sentStepsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      if (sessionStorage.getItem(STARTED_KEY)) return;
      sessionStorage.setItem(STARTED_KEY, "1");
    } catch {
      /* storage disabled — still record the start once for this mount */
    }
    trackOwtiEvent({ type: "start" });
  }, []);

  // Persist on change (no setState → not an effect-setState violation).
  useEffect(() => {
    try {
      sessionStorage.setItem(
        OWTI_ANSWERS_STORAGE_KEY,
        JSON.stringify(answers),
      );
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

  const finish = async () => {
    setSubmitting(true);
    try {
      const result = computeResult(answers);
      const encoded = encodeAverages(result.scores);
      trackOwtiEvent({ type: "complete", code: result.code });
      try {
        // Reliable hand-off to the result page (the URL hash alone can be lost
        // across a client-side navigation). Keyed by code so it can't be
        // mistaken for someone else's result on a different type page.
        sessionStorage.setItem(
          RESULT_STORAGE_KEY,
          JSON.stringify({ code: result.code, averages: encoded }),
        );
      } catch {
        /* storage disabled — the hash below still covers most cases */
      }

      const resultPath = `/owti/result/${result.code}#${encoded}`;
      try {
        // The authenticated result page persists the server-verified result,
        // then clears the answers only after the database write succeeds.
        sessionStorage.setItem(OWTI_RESULT_PENDING_STORAGE_KEY, result.code);
      } catch {
        /* storage disabled — the result can still be viewed, but not saved */
      }

      if (!isAuthenticated) {
        await signIn("kakao", { redirectTo: resultPath });
        return;
      }

      router.push(resultPath);
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
      void finish();
      return;
    }
    // Funnel: record finishing this domain step (1-based), once each.
    const finishedStep = step + 1;
    if (!sentStepsRef.current.has(finishedStep)) {
      sentStepsRef.current.add(finishedStep);
      trackOwtiEvent({ type: "advance", step: finishedStep });
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
          <span className="text-muted-foreground tabular-nums">
            {progressPct}% 완료
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
          className={[
            "inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition hover:opacity-90 disabled:opacity-50",
            isLast && !isAuthenticated
              ? "bg-[#FEE500] text-[#191919]"
              : "bg-foreground text-background",
          ].join(" ")}
        >
          {isLast && !isAuthenticated && !submitting ? (
            <KakaoIcon />
          ) : null}
          {submitting
            ? isLast && !isAuthenticated
              ? "카카오로 이동 중…"
              : "결과 계산 중…"
            : isLast && !isAuthenticated
              ? "카카오로 로그인하고 결과 보기"
              : isLast
                ? "결과 보기"
                : "다음"}
        </button>
      </div>
    </div>
  );
}

function KakaoIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 shrink-0 fill-current"
    >
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.87 1.9 5.39 4.76 6.8l-.97 3.56a.5.5 0 0 0 .76.55l4.25-2.82c.39.04.79.06 1.2.06 5.52 0 10-3.58 10-8S17.52 3 12 3Z" />
    </svg>
  );
}
