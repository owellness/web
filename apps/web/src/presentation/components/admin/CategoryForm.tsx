"use client";

import { useActionState } from "react";

import type { Category } from "@/application/categories/model";
import type { CategoryFormResult } from "@/presentation/actions/categories";

export type CategoryFormProps = {
  initial?: Pick<Category, "id" | "slug" | "name" | "description" | "seoTitle" | "seoDescription">;
  action: (formData: FormData) => Promise<CategoryFormResult>;
  submitLabel: string;
};

type State = CategoryFormResult | null;

export function CategoryForm({ initial, action, submitLabel }: CategoryFormProps) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => action(formData),
    null,
  );

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      <input type="hidden" name="id" value={initial?.id ?? ""} />

      <label className="block">
        <span className="text-sm font-medium text-foreground">이름</span>
        <input
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          placeholder="예: 수면 · 스트레스 · 정신건강"
          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-base text-card-foreground outline-none focus:border-accent"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-foreground">슬러그 (URL)</span>
        <input
          name="slug"
          defaultValue={initial?.slug ?? ""}
          placeholder="예: sleep (비우면 이름에서 자동 생성)"
          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm text-card-foreground outline-none focus:border-accent"
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          영문·숫자·하이픈만 사용하세요. 한글 입력 시 저장 시 자동으로 로마자로
          변환됩니다. 공개 URL은 <code>/{"{슬러그}"}</code> 형태입니다.
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-foreground">설명</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ""}
          placeholder="카테고리 페이지에 보이는 한 문단 설명."
          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground outline-none focus:border-accent"
        />
      </label>

      <fieldset className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <legend className="px-1 text-sm font-medium text-foreground">
          SEO 메타
        </legend>
        <label className="block">
          <span className="text-sm text-muted-foreground">SEO 제목</span>
          <input
            name="seoTitle"
            defaultValue={initial?.seoTitle ?? ""}
            placeholder="(비우면 이름이 그대로 사용됩니다)"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted-foreground">SEO 설명</span>
          <textarea
            name="seoDescription"
            rows={2}
            defaultValue={initial?.seoDescription ?? ""}
            placeholder="(비우면 설명이 사용됩니다. 160자 이내 권장)"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
      </fieldset>

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
