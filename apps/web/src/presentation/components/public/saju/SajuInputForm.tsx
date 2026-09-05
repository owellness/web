"use client";

import { ArrowRight, CalendarDays, Clock3, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { calculateSajuWellness } from "@/application/saju";
import { saveSajuResult } from "@/presentation/lib/sajuStorage";

function getTodayInSeoul(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function SajuInputForm() {
  const router = useRouter();
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!birthDate) throw new Error("생년월일을 입력해주세요.");
      if (!timeUnknown && !birthTime) {
        throw new Error("출생 시간을 입력하거나 ‘시간을 몰라요’를 선택해주세요.");
      }

      const result = calculateSajuWellness({
        birthDate,
        birthTime: timeUnknown ? null : birthTime,
      });
      if (!saveSajuResult(result)) {
        throw new Error(
          "브라우저 저장 공간을 사용할 수 없어 결과를 열지 못했어요. 설정을 확인해주세요.",
        );
      }
      router.push("/saju/result");
    } catch (caught) {
      setSubmitting(false);
      setError(
        caught instanceof Error
          ? caught.message
          : "계산 중 문제가 생겼어요. 입력을 다시 확인해주세요.",
      );
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-8"
    >
      <div className="flex items-start gap-3 border-b border-border pb-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
          <CalendarDays className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">
            출생 정보 입력
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            현재 첫 버전은 대한민국 출생·양력 날짜를 지원해요.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-card-foreground">
            생년월일 <span className="text-accent">*</span>
          </span>
          <input
            type="date"
            required
            min="1900-01-01"
            max={getTodayInSeoul()}
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-base text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
          <span className="mt-1.5 block text-xs text-muted-foreground">
            양력 기준
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-card-foreground">
            출생 시간 {!timeUnknown ? <span className="text-accent">*</span> : null}
          </span>
          <span className="relative mt-2 block">
            <Clock3
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="time"
              required={!timeUnknown}
              disabled={timeUnknown}
              value={birthTime}
              onChange={(event) => setBirthTime(event.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-background pr-3 pl-10 text-base text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-45 focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </span>
          <span className="mt-1.5 block text-xs text-muted-foreground">
            출생 당시 시계에 표시된 시간
          </span>
        </label>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-muted/60 px-4 py-3">
        <input
          type="checkbox"
          checked={timeUnknown}
          onChange={(event) => setTimeUnknown(event.target.checked)}
          className="mt-0.5 size-4 rounded border-border accent-[var(--accent)]"
        />
        <span>
          <span className="block text-sm font-medium text-foreground">
            출생 시간을 몰라요
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            임의의 시주를 만들지 않고 연주·월주·일주 6글자만 보여드려요.
          </span>
        </span>
      </label>

      <div className="mt-5 rounded-xl border border-border px-4 py-3">
        <p className="text-sm font-medium text-card-foreground">출생 지역</p>
        <p className="mt-1 text-sm text-muted-foreground">
          대한민국 · Asia/Seoul 시간대
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm leading-relaxed text-red-700 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {submitting ? "나의 리듬을 읽는 중…" : "명리 웰니스 리포트 보기"}
        {!submitting ? <ArrowRight className="size-4" aria-hidden /> : null}
      </button>

      <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-xs leading-relaxed text-muted-foreground">
        <LockKeyhole className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        출생 정보는 이 브라우저 안에서만 계산되며 서버로 전송하거나 계정에
        저장하지 않아요.
      </p>
    </form>
  );
}
