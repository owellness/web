"use client";

import { LogOut } from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import { useState } from "react";

export function KakaoLoginButton() {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signIn("kakao", { redirectTo: "/mypage" });
      }}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-6 py-3 text-sm font-semibold text-[#191919] transition hover:brightness-95 disabled:cursor-wait disabled:opacity-70"
    >
      <KakaoIcon />
      {pending ? "카카오로 이동 중…" : "카카오로 로그인"}
    </button>
  );
}

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signOut({ redirectTo: "/" });
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-wait disabled:opacity-60"
    >
      <LogOut className="size-4" aria-hidden />
      {pending ? "로그아웃 중…" : "로그아웃"}
    </button>
  );
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-current">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.85 5.34 4.64 6.76l-1.18 4.36a.45.45 0 0 0 .69.49l5.13-3.4c.24.02.48.03.72.03 5.52 0 10-3.58 10-8.24S17.52 3 12 3Z" />
    </svg>
  );
}
