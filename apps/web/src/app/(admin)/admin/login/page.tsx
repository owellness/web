import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

import { SITE_NAME } from "@/config/site";
import { auth, signIn } from "@/infrastructure/auth/authConfig";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "아이디 또는 비밀번호가 올바르지 않습니다.",
  Configuration:
    "서버 인증 설정에 문제가 있습니다. AUTH_SECRET·ADMIN_USERNAME·ADMIN_PASSWORD·DATABASE_URL 환경변수를 확인해주세요.",
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
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!username || !password) {
      redirect(`/admin/login?error=CredentialsSignin`);
    }
    try {
      await signIn("credentials", { username, password, redirectTo });
    } catch (e) {
      // signIn issues a redirect() on success — that must propagate.
      if (isRedirectError(e)) throw e;
      // Invalid credentials (or any auth error) → visible message, not a 500.
      redirect(`/admin/login?error=CredentialsSignin`);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-20">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {SITE_NAME} 어드민 로그인
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          관리자 아이디와 비밀번호로 로그인하세요.
        </p>
      </div>

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {errorMessage}
        </p>
      ) : null}

      <form action={signInAction} className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          아이디
          <input
            type="text"
            name="username"
            required
            autoComplete="username"
            autoCapitalize="none"
            placeholder="admin"
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-base text-card-foreground outline-none transition focus:border-accent"
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          비밀번호
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-base text-card-foreground outline-none transition focus:border-accent"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
        >
          로그인
        </button>
      </form>
    </div>
  );
}
