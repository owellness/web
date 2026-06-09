"use client";

import { useRef, useState, useTransition } from "react";

import type { SiteSettings } from "@/application/settings/model";
import type { SettingsFormResult } from "@/presentation/actions/settings";
import { uploadImage } from "@/presentation/lib/uploadImage";

export function SettingsForm({
  initial,
  action,
}: {
  initial: SiteSettings;
  action: (formData: FormData) => Promise<SettingsFormResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);
  const [faviconUrl, setFaviconUrl] = useState(initial.faviconUrl ?? "");
  const [faviconUploading, setFaviconUploading] = useState(false);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleFavicon = (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    setFaviconUploading(true);
    uploadImage(file)
      .then(({ url }) => setFaviconUrl(url))
      .catch((e) =>
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "업로드 실패",
        }),
      )
      .finally(() => {
        setFaviconUploading(false);
        if (faviconInputRef.current) faviconInputRef.current.value = "";
      });
  };

  return (
    <form
      className="max-w-2xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("faviconUrl", faviconUrl);
        startTransition(async () => {
          const res = await action(fd);
          setMessage(
            res.ok
              ? { type: "success", text: "저장되었습니다." }
              : { type: "error", text: res.error },
          );
        });
      }}
    >
      <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <legend className="px-1 text-sm font-medium text-foreground">
          홈 화면 소개
        </legend>
        <label className="block">
          <span className="text-sm text-muted-foreground">상단 라벨</span>
          <input
            name="heroEyebrow"
            defaultValue={initial.heroEyebrow}
            placeholder="Evidence-based wellness"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted-foreground">
            제목 (줄바꿈 그대로 반영)
          </span>
          <textarea
            name="heroTitle"
            rows={2}
            defaultValue={initial.heroTitle}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted-foreground">소개 문단</span>
          <textarea
            name="heroSubtitle"
            rows={4}
            defaultValue={initial.heroSubtitle}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
      </fieldset>

      <fieldset className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <legend className="px-1 text-sm font-medium text-foreground">
          파비콘
        </legend>
        <p className="text-xs text-muted-foreground">
          브라우저 탭에 표시되는 아이콘입니다. 정사각형 PNG(예: 256×256)를
          권장합니다.
        </p>
        <div className="flex items-center gap-3">
          {faviconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={faviconUrl}
              alt="파비콘 미리보기"
              className="size-10 rounded-md border border-border object-contain bg-background"
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
              없음
            </div>
          )}
          <button
            type="button"
            disabled={faviconUploading}
            onClick={() => faviconInputRef.current?.click()}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            {faviconUploading ? "업로드 중…" : "이미지 업로드"}
          </button>
          {faviconUrl ? (
            <button
              type="button"
              onClick={() => setFaviconUrl("")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              제거
            </button>
          ) : null}
        </div>
        <input
          ref={faviconInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => handleFavicon(e.target.files?.[0])}
        />
      </fieldset>

      {message ? (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            message.type === "success"
              ? "bg-accent/15 text-accent"
              : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || faviconUploading}
        className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}
