import { redirect } from "next/navigation";

import { SITE_NAME } from "@/config/site";
import { auth, signIn } from "@/infrastructure/auth/authConfig";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  const redirectTo = callbackUrl ?? "/admin";

  if (session?.user?.role === "admin") {
    redirect(redirectTo);
  }

  async function signInAction(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    if (!email) return;
    await signIn("resend", {
      email,
      redirectTo,
    });
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
