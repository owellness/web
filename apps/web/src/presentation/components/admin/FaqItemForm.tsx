"use client";

import { useActionState } from "react";

import type { FaqItem } from "@/application/faq/model";
import type { FaqFormResult } from "@/presentation/actions/faq";

export type FaqItemFormProps = {
  initial?: Pick<FaqItem, "id" | "question" | "answer" | "position" | "isPublished">;
  action: (formData: FormData) => Promise<FaqFormResult>;
  submitLabel: string;
};

type State = FaqFormResult | null;

export function FaqItemForm({ initial, action, submitLabel }: FaqItemFormProps) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => action(formData),
    null,
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <input type="hidden" name="id" value={initial?.id ?? ""} />

      <label className="block">
        <span className="text-sm font-medium text-foreground">질문</span>
        <input
          name="question"
          required
          maxLength={240}
          defaultValue={initial?.question ?? ""}
          placeholder="예: 뉴스레터는 얼마나 자주 발행되나요?"
          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-base text-card-foreground outline-none focus:border-accent"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-foreground">답변</span>
        <textarea
          name="answer"
          required
          rows={5}
          maxLength={4000}
          defaultValue={initial?.answer ?? ""}
          placeholder="답변을 입력하세요. 줄바꿈은 그대로 표시됩니다."
          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm leading-relaxed text-card-foreground outline-none focus:border-accent"
        />
      </label>

      <div className="flex flex-wrap items-center gap-6">
        <label className="block">
          <span className="text-sm font-medium text-foreground">순서</span>
          <input
            name="position"
            type="number"
            min={0}
            defaultValue={initial?.position ?? 0}
            className="mt-1 w-28 rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground outline-none focus:border-accent"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            작은 숫자가 위로 정렬됩니다.
          </span>
        </label>

        <label className="flex items-center gap-2 pt-5">
          <input
            name="isPublished"
            type="checkbox"
            defaultChecked={initial?.isPublished ?? true}
            className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
          />
          <span className="text-sm font-medium text-foreground">공개</span>
        </label>
      </div>

      {state && !state.ok ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "저장 중…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
