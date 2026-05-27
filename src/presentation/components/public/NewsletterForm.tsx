"use client";

import { useActionState } from "react";

import type {
  NewsletterFormResult,
  subscribeAction,
} from "@/presentation/actions/newsletter";

type State = NewsletterFormResult | null;

export function NewsletterForm({
  action,
}: {
  action: typeof subscribeAction;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => action(formData),
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-foreground">이메일 주소</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="hello@example.com"
          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base text-card-foreground outline-none focus:border-accent"
        />
      </label>

      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 size-4 rounded border-border accent-accent"
        />
        <span>
          마케팅 정보 수신에 동의합니다. 언제든지 이메일 하단의 링크로 해지할 수
          있습니다.
        </span>
      </label>

      {state ? (
        state.ok ? (
          <p className="rounded-md bg-accent/15 px-3 py-2 text-sm text-accent">
            {state.status === "already_confirmed"
              ? "이미 구독 중입니다. 감사합니다!"
              : "메일함을 확인하고 구독을 완료해주세요."}
          </p>
        ) : (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {state.error}
          </p>
        )
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "처리 중…" : "구독 신청"}
      </button>
    </form>
  );
}
