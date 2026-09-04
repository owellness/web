import type { Metadata } from "next";
import Link from "next/link";

import { SITE_NAME, SITE_URL } from "@/config/site";
import { auth } from "@/infrastructure/auth/authConfig";
import { OwtiQuiz } from "@/presentation/components/public/owti/OwtiQuiz";

export const metadata: Metadata = {
  title: "웰니스 유형 검사 진행",
  description: "지난 한 달을 기준으로 답하고 나의 O! Wellness Type을 확인해보세요.",
  alternates: { canonical: `${SITE_URL}/owti` },
  // The interactive form itself shouldn't be indexed — /owti is the canonical
  // landing page and /owti/result/[code] holds the indexable content.
  robots: { index: false, follow: true },
};

export default async function OwtiTestPage({
  searchParams,
}: {
  searchParams: Promise<{ authError?: string }>;
}) {
  const [session, query] = await Promise.all([auth(), searchParams]);
  const hasAuthError = query.authError === "1";

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <nav aria-label="breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          홈
        </Link>
        <span aria-hidden> · </span>
        <Link href="/owti" className="hover:text-foreground">
          웰니스 유형 검사
        </Link>
        <span aria-hidden> · </span>
        <span>검사 진행</span>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          O! Wellness Type 자가진단
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          지난 한 달을 기준으로, 각 문항이 나에게 해당하는 정도를 솔직하게
          선택해주세요. 정답은 없습니다.
        </p>
      </header>

      {hasAuthError ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
        >
          카카오 로그인을 완료하지 못했어요. 답변은 그대로 남아 있으니 다시
          시도해주세요.
        </p>
      ) : null}

      <div className="mt-6">
        <OwtiQuiz
          isAuthenticated={Boolean(session?.user)}
          resumeAtLastStep={hasAuthError}
        />
      </div>

      <p className="mt-10 text-center text-xs leading-relaxed text-muted-foreground">
        {SITE_NAME}의 OWTI 검사는 정보 제공을 목적으로 하며, 의학적 진단을
        대체하지 않습니다. 결과 확인에는 카카오 로그인이 필요하지만 개별 응답은
        저장되지 않으며, 서비스 개선을 위한 익명 통계(진행 단계·완료 유형)만
        수집됩니다.
      </p>
    </section>
  );
}
