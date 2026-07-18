"use client";

import Link from "next/link";
import { useEffect } from "react";

// Admin error boundary. Without this, any thrown server error renders Next.js's
// bare "This page couldn't load" 500 screen with no way back. Here we give the
// admin a recoverable UI (retry + return to the article list) and log details.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error boundary]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-card-foreground">
        문제가 발생했습니다
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        요청을 처리하는 중 오류가 났습니다. 방금 요청한 작업(예: 삭제)은
        완료되었을 수 있습니다. 다시 시도하거나 목록으로 돌아가세요.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          오류 코드: {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          다시 시도
        </button>
        <Link
          href="/admin/articles"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          아티클 목록으로
        </Link>
      </div>
    </div>
  );
}
