import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

import { SITE_NAME } from "@/config/site";
import { auth, signIn } from "@/infrastructure/auth/authConfig";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  send: "로그인 메일을 보내지 못했습니다. 이메일 발송 설정(RESEND_API_KEY·발신 주소·도메인 인증) 또는 DB 연결을 확인해주세요.",
  AccessDenied:
    "허용되지 않은 이메일입니다. 관리자 화이트리스트(ADMIN_EMAILS)에 등록된 주소인지 확인해주세요.",
  Configuration:
    "서버 인증 설정에 문제가 있습니다. AUTH_SECRET·AUTH_URL·DATABASE_URL 환경변수를 확인해주세요.",
  Verification:
    "로그인 링크가 만료되었거나 이미 사용되었습니다. 아래에서 새 링크를 요청해 30분 안에 클릭해주세요.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;
  const redirectTo = callbackUrl ?? "/admin";

  if (session?.user?.role === "admin") {
    redirect(redirectTo);
  }

  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? "로그인 처리 중 오류가 발생했습니다.")
    : null;

  async function signInAction(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    if (!email) return;
    try {
      await signIn("resend", { email, redirectTo });
    } catch (e) {
      // signIn issues a redirect() on success — that must propagate.
      if (isRedirectError(e)) throw e;
      // Everything else (email send failure, DB write failure, access
      // denied) becomes a visible message instead of a 500 page.
      console.error("[admin signIn]", e);
      redirect(`/admin/login?error=send`);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-20">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {SITE_NAME} 어드민 로그인
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          허용된 관리자 이메일로 매직 링크를 보내드립니다.
        </p>
      </div>

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {errorMessage}
        </p>
      ) : null}

      <form action={signInAction} className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          이메일
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="admin@example.com"
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-base text-card-foreground outline-none transition focus:border-accent"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
        >
          로그인 링크 보내기
        </button>
      </form>
    </div>
  );
}
