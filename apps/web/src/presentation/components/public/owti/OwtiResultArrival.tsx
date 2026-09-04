"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  OWTI_ANSWERS_STORAGE_KEY,
  OWTI_LOGIN_PENDING_STORAGE_KEY,
  OWTI_RESULT_PENDING_STORAGE_KEY,
} from "@/presentation/lib/owtiStorage";

type SaveState = "idle" | "saving" | "saved" | "failed";

/** Persist a completed questionnaire after the authenticated result arrives. */
export function OwtiResultArrival({ code }: { code: string }) {
  const [state, setState] = useState<SaveState>("idle");

  useEffect(() => {
    let cancelled = false;

    const persist = async () => {
      let answers: unknown;
      let pendingCode: string | null;

      try {
        pendingCode =
          sessionStorage.getItem(OWTI_RESULT_PENDING_STORAGE_KEY) ??
          // Backward compatibility for an OAuth round trip begun before the
          // result-history release.
          sessionStorage.getItem(OWTI_LOGIN_PENDING_STORAGE_KEY);
        if (pendingCode !== code) return;

        const raw = sessionStorage.getItem(OWTI_ANSWERS_STORAGE_KEY);
        if (!raw) return;
        answers = JSON.parse(raw);
      } catch {
        if (!cancelled) setState("failed");
        return;
      }

      if (!cancelled) setState("saving");

      try {
        const response = await fetch("/api/owti/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
        if (!response.ok) throw new Error(`save failed: ${response.status}`);

        sessionStorage.removeItem(OWTI_ANSWERS_STORAGE_KEY);
        sessionStorage.removeItem(OWTI_LOGIN_PENDING_STORAGE_KEY);
        sessionStorage.removeItem(OWTI_RESULT_PENDING_STORAGE_KEY);
        if (!cancelled) setState("saved");
      } catch {
        // Keep the pending answers so a refresh can retry the write.
        if (!cancelled) setState("failed");
      }
    };

    void persist();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (state === "idle") return null;

  return (
    <div
      role={state === "failed" ? "alert" : "status"}
      className={[
        "mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
        state === "failed"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
          : "border-accent/25 bg-accent/5 text-foreground",
      ].join(" ")}
    >
      <span>
        {state === "saving" && "검사 결과를 마이페이지에 저장하고 있어요."}
        {state === "saved" && "검사 결과가 마이페이지에 저장됐어요."}
        {state === "failed" &&
          "검사 결과를 저장하지 못했어요. 페이지를 새로고침해 다시 시도해주세요."}
      </span>
      {state === "saved" ? (
        <Link href="/mypage" className="font-medium text-accent hover:underline">
          검사 이력 보기
        </Link>
      ) : null}
    </div>
  );
}
