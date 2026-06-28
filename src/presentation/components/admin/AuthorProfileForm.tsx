"use client";

import { useRef, useState, useTransition } from "react";

import type { Author } from "@/application/authors/model";
import { SOCIAL_PLATFORMS } from "@/application/authors/social";
import type { AuthorProfileFormResult } from "@/presentation/actions/authors";
import { uploadImage } from "@/presentation/lib/uploadImage";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function AuthorProfileForm({
  initial,
  action,
}: {
  initial: Author;
  action: (formData: FormData) => Promise<AuthorProfileFormResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatar = (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    setAvatarUploading(true);
    uploadImage(file)
      .then(({ url }) => setAvatarUrl(url))
      .catch((e) =>
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "업로드 실패",
        }),
      )
      .finally(() => {
        setAvatarUploading(false);
        if (avatarInputRef.current) avatarInputRef.current.value = "";
      });
  };

  return (
    <form
      className="max-w-2xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("avatarUrl", avatarUrl);
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
          기본 정보
        </legend>

        <div className="flex items-start gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="프로필 사진 미리보기"
              className="size-16 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full border border-dashed border-border bg-muted text-lg font-semibold text-muted-foreground">
              {initial.displayName.charAt(0) || "?"}
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">프로필 사진</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={avatarUploading}
                onClick={() => avatarInputRef.current?.click()}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
              >
                {avatarUploading ? "업로드 중…" : "사진 업로드"}
              </button>
              {avatarUrl ? (
                <button
                  type="button"
                  onClick={() => setAvatarUrl("")}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  제거
                </button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              정사각형 이미지(예: 400×400)를 권장합니다.
            </p>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => handleAvatar(e.target.files?.[0])}
          />
        </div>

        <label className="block">
          <span className="text-sm font-medium text-foreground">이름</span>
          <input
            name="displayName"
            required
            maxLength={120}
            defaultValue={initial.displayName}
            placeholder="예: 오웰니스 편집팀"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">
            슬러그 (URL)
          </span>
          <input
            name="slug"
            defaultValue={initial.slug}
            placeholder="비우면 이름에서 자동 생성"
            className={`${inputClass} font-mono`}
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            공개 주소는 <code>/authors/{"{슬러그}"}</code> 형태입니다. 영문 소문자·숫자·하이픈만
            사용하세요. 한글은 저장 시 자동으로 로마자로 변환됩니다.
          </span>
        </label>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <legend className="px-1 text-sm font-medium text-foreground">
          프로필 소개
        </legend>

        <label className="block">
          <span className="text-sm text-muted-foreground">직함 · 자격</span>
          <input
            name="credentials"
            maxLength={200}
            defaultValue={initial.credentials ?? ""}
            placeholder="예: 영양학 석사 · 임상영양사"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-sm text-muted-foreground">소속</span>
          <input
            name="affiliation"
            maxLength={200}
            defaultValue={initial.affiliation ?? ""}
            placeholder="예: 오웰니스"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-sm text-muted-foreground">소개</span>
          <textarea
            name="bio"
            rows={4}
            maxLength={2000}
            defaultValue={initial.bio}
            placeholder="저자 페이지 상단에 표시되는 한두 문단의 소개."
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-sm text-muted-foreground">웹사이트</span>
          <input
            name="websiteUrl"
            type="url"
            inputMode="url"
            maxLength={500}
            defaultValue={initial.websiteUrl ?? ""}
            placeholder="https://example.com"
            className={inputClass}
          />
        </label>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <legend className="px-1 text-sm font-medium text-foreground">
          소셜 링크
        </legend>
        <p className="text-xs text-muted-foreground">
          입력한 링크는 저자 페이지의 구조화 데이터(검색엔진용)에 반영됩니다.
          비워 두면 표시되지 않습니다.
        </p>
        {SOCIAL_PLATFORMS.map((platform) => (
          <label key={platform.key} className="block">
            <span className="text-sm text-muted-foreground">
              {platform.label}
            </span>
            <input
              name={`social_${platform.key}`}
              type="url"
              inputMode="url"
              maxLength={500}
              defaultValue={initial.social?.[platform.key] ?? ""}
              placeholder={platform.placeholder}
              className={inputClass}
            />
          </label>
        ))}
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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || avatarUploading}
          className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <a
          href={`/authors/${initial.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          공개 프로필 보기 →
        </a>
      </div>
    </form>
  );
}
