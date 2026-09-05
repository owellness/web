import type { Metadata } from "next";
import Link from "next/link";

import { SITE_NAME, SITE_URL } from "@/config/site";
import { subscribeAction } from "@/presentation/actions/newsletter";
import { NewsletterForm } from "@/presentation/components/public/NewsletterForm";

export const metadata: Metadata = {
  title: "뉴스레터 구독",
  description: `${SITE_NAME}의 근거 기반 웰니스 콘텐츠를 매주 이메일로 받아보세요.`,
  alternates: { canonical: `${SITE_URL}/newsletter` },
};

const STATUS_COPY: Record<string, { type: "success" | "info" | "error"; text: string }> = {
  confirmed: {
    type: "success",
    text: "구독이 완료되었습니다. 감사합니다!",
  },
  unsubscribed: {
    type: "info",
    text: "구독이 해지되었습니다.",
  },
  invalid: {
    type: "error",
    text: "유효하지 않거나 만료된 링크입니다.",
  },
};

export default async function NewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const banner = status ? STATUS_COPY[status] : null;

  return (
    <section className="mx-auto max-w-xl px-4 py-20 sm:px-6">
      <header className="space-y-3 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          Weekly Newsletter
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {SITE_NAME} 뉴스레터
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          한 주의 근거 기반 웰니스 인사이트와 곧 출시될 오! 웰니스 앱의 진단·코칭
          기능 베타 초대를 가장 먼저 보내드립니다.
        </p>
      </header>

      {banner ? (
        <div
          className={`mt-6 rounded-md px-4 py-3 text-sm ${
            banner.type === "success"
              ? "bg-accent/15 text-accent"
              : banner.type === "info"
                ? "bg-muted text-muted-foreground"
                : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          {banner.text}
        </div>
      ) : null}

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <NewsletterForm action={subscribeAction} />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        구독 동의 시{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          개인정보 처리방침
        </Link>
        에 따라 이메일 주소가 안전하게 관리됩니다.
      </p>
    </section>
  );
}
