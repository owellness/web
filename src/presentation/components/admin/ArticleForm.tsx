"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Article, TiptapDocument } from "@/application/articles/model";
import type { CategoryDefinition } from "@/config/site";
import { TiptapEditor } from "./TiptapEditor";

const EMPTY_DOC: TiptapDocument = { type: "doc", content: [] };

export type ArticleFormProps = {
  initial?: Pick<
    Article,
    | "id"
    | "slug"
    | "title"
    | "excerpt"
    | "tldr"
    | "contentJson"
    | "status"
    | "primaryCategorySlug"
    | "tags"
    | "seoTitle"
    | "seoDescription"
    | "ogImageUrl"
  >;
  categories: ReadonlyArray<CategoryDefinition>;
  defaultCategorySlug: string;
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
};

export function ArticleForm({
  initial,
  categories,
  defaultCategorySlug,
  action,
}: ArticleFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [contentJson, setContentJson] = useState<TiptapDocument>(
    initial?.contentJson ?? EMPTY_DOC,
  );
  const [tldrText, setTldrText] = useState((initial?.tldr ?? []).join("\n"));
  const [tagText, setTagText] = useState(
    (initial?.tags ?? []).map((t) => t.slug).join(", "),
  );

  const onSubmit = (formData: FormData, status: "draft" | "published") => {
    formData.set("status", status);
    formData.set("contentJson", JSON.stringify(contentJson));
    formData.set(
      "tldr",
      tldrText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join("\n"),
    );
    formData.set(
      "tagSlugs",
      tagText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .join(","),
    );

    startTransition(async () => {
      const res = await action(formData);
      if (!res.ok) {
        setError(res.error ?? "저장에 실패했습니다.");
        return;
      }
      router.push("/admin/articles");
      router.refresh();
    });
  };

  return (
    <form
      className="grid gap-6 lg:grid-cols-[1fr_320px]"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const action = (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
          "data-status",
        );
        onSubmit(fd, action === "published" ? "published" : "draft");
      }}
    >
      <input type="hidden" name="id" value={initial?.id ?? ""} />

      <div className="space-y-6">
        <label className="block">
          <span className="text-sm font-medium text-foreground">제목</span>
          <input
            name="title"
            required
            defaultValue={initial?.title ?? ""}
            placeholder="기사 제목"
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-lg font-semibold text-card-foreground outline-none focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">슬러그 (URL)</span>
          <input
            name="slug"
            required
            defaultValue={initial?.slug ?? ""}
            placeholder="예: 수면-호르몬-가이드"
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm text-card-foreground outline-none focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">
            요약 (검색 결과 description)
          </span>
          <textarea
            name="excerpt"
            required
            rows={2}
            maxLength={300}
            defaultValue={initial?.excerpt ?? ""}
            placeholder="160자 이내로 요약하세요. 검색 결과 미리보기에 사용됩니다."
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground outline-none focus:border-accent"
          />
        </label>

        <div className="block">
          <span className="text-sm font-medium text-foreground">
            TL;DR (한 줄에 하나씩 · AEO 답변 박스로 노출)
          </span>
          <textarea
            value={tldrText}
            onChange={(e) => setTldrText(e.target.value)}
            rows={4}
            placeholder={"수면 부족은 단 1주만으로도 식욕 호르몬을 흐트러뜨립니다.\n수면 시간 7-9시간이 가장 안정적입니다."}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground outline-none focus:border-accent"
          />
        </div>

        <div className="block">
          <span className="text-sm font-medium text-foreground">본문</span>
          <div className="mt-1">
            <TiptapEditor
              initialValue={contentJson}
              onChange={setContentJson}
            />
          </div>
        </div>
      </div>

      <aside className="space-y-6 rounded-2xl border border-border bg-card p-5">
        <div>
          <span className="text-sm font-medium text-foreground">카테고리</span>
          <select
            name="primaryCategorySlug"
            defaultValue={initial?.primaryCategorySlug ?? defaultCategorySlug}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="text-sm font-medium text-foreground">
            태그 (쉼표로 구분)
          </span>
          <input
            value={tagText}
            onChange={(e) => setTagText(e.target.value)}
            placeholder="수면위생, 멜라토닌"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        <div className="space-y-1">
          <span className="text-sm font-medium text-foreground">SEO 제목</span>
          <input
            name="seoTitle"
            defaultValue={initial?.seoTitle ?? ""}
            placeholder="(비워두면 제목 사용)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
          <span className="text-sm font-medium text-foreground">SEO 설명</span>
          <textarea
            name="seoDescription"
            defaultValue={initial?.seoDescription ?? ""}
            rows={2}
            placeholder="(비워두면 요약 사용)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        <div className="space-y-1">
          <span className="text-sm font-medium text-foreground">대표 이미지 URL</span>
          <input
            name="ogImageUrl"
            defaultValue={initial?.ogImageUrl ?? ""}
            placeholder="https://..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="submit"
            data-status="published"
            disabled={pending}
            className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "저장 중…" : "발행하기"}
          </button>
          <button
            type="submit"
            data-status="draft"
            disabled={pending}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            초안으로 저장
          </button>
        </div>
      </aside>
    </form>
  );
}
