"use client";

import { useActionState, useState } from "react";

import type { TiptapDocument } from "@/application/articles/model";
import type { SitePage } from "@/application/pages/model";
import type { PageFormResult } from "@/presentation/actions/pages";

import { TiptapEditor } from "./TiptapEditor";

const EMPTY_DOC: TiptapDocument = { type: "doc", content: [] };

export type PageFormProps = {
  slug: string;
  publicPath: string;
  initial?: Pick<SitePage, "title" | "bodyJson" | "seoTitle" | "seoDescription">;
  action: (formData: FormData) => Promise<PageFormResult>;
};

type State = PageFormResult | null;

export function PageForm({ slug, publicPath, initial, action }: PageFormProps) {
  const [bodyJson, setBodyJson] = useState<TiptapDocument>(
    initial?.bodyJson ?? EMPTY_DOC,
  );
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => action(formData),
    null,
  );

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="bodyJson" value={JSON.stringify(bodyJson)} />

      <label className="block">
        <span className="text-sm font-medium text-foreground">제목</span>
        <input
          name="title"
          required
          maxLength={200}
          defaultValue={initial?.title ?? ""}
          placeholder="페이지 제목"
          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-lg font-semibold text-card-foreground outline-none focus:border-accent"
        />
      </label>

      <div className="block">
        <span className="text-sm font-medium text-foreground">본문</span>
        <div className="mt-1">
          <TiptapEditor initialValue={bodyJson} onChange={setBodyJson} />
        </div>
      </div>

      <fieldset className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <legend className="px-1 text-sm font-medium text-foreground">
          SEO 메타
        </legend>
        <label className="block">
          <span className="text-sm text-muted-foreground">SEO 제목</span>
          <input
            name="seoTitle"
            defaultValue={initial?.seoTitle ?? ""}
            placeholder="(비우면 제목이 사용됩니다)"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted-foreground">SEO 설명</span>
          <textarea
            name="seoDescription"
            rows={2}
            defaultValue={initial?.seoDescription ?? ""}
            placeholder="(검색 결과 미리보기 설명. 160자 이내 권장)"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
      </fieldset>

      {state && !state.ok ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
      {state && state.ok ? (
        <p className="rounded-md bg-accent/15 px-3 py-2 text-sm text-accent">
          저장되었습니다.{" "}
          <a href={publicPath} target="_blank" rel="noreferrer" className="underline">
            공개 페이지 보기
          </a>
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
