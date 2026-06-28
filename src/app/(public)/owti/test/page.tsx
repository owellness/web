import type { Metadata } from "next";
import Link from "next/link";

import { TOTAL_QUESTIONS } from "@/application/owti";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { OwtiQuiz } from "@/presentation/components/public/owti/OwtiQuiz";

export const metadata: Metadata = {
  title: "웰니스 유형 검사 진행",
  description: `${TOTAL_QUESTIONS}문항에 답하고 나의 O! Wellness Type을 확인해보세요.`,
  alternates: { canonical: `${SITE_URL}/owti` },
  // The interactive form itself shouldn't be indexed — /owti is the canonical
  // landing page and /owti/result/[code] holds the indexable content.
  robots: { index: false, follow: true },
};

export default function OwtiTestPage() {
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

      <div className="mt-6">
        <OwtiQuiz />
      </div>

      <p className="mt-10 text-center text-xs leading-relaxed text-muted-foreground">
        {SITE_NAME}의 OWTI 검사는 정보 제공을 목적으로 하며, 의학적 진단을
        대체하지 않습니다. 개별 응답은 저장되지 않으며, 서비스 개선을 위한 익명
        통계(진행 단계·완료 유형)만 수집됩니다.
      </p>
    </section>
  );
}
