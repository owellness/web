import Link from "next/link";

import { auth } from "@/infrastructure/auth/authConfig";

export default async function AdminDashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          어드민 대시보드
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {session?.user?.email}님으로 로그인되었습니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            href: "/admin/articles",
            title: "아티클 관리",
            desc: "새 글 발행, 초안 정리, 발행 일정 관리.",
          },
          {
            href: "/admin/categories",
            title: "카테고리·태그",
            desc: "콘텐츠 분류 체계와 SEO 메타데이터 관리.",
          },
          {
            href: "/admin/pages",
            title: "페이지",
            desc: "소개 등 고정 페이지의 제목·본문·SEO 수정.",
          },
          {
            href: "/admin/faq",
            title: "자주 묻는 질문",
            desc: "FAQ 질문·답변 추가, 수정, 공개 여부 관리.",
          },
          {
            href: "/admin/subscribers",
            title: "뉴스레터 구독자",
            desc: "구독 현황과 발송 이력 확인.",
          },
          {
            href: "/admin/settings",
            title: "사이트 설정",
            desc: "홈 화면 소개 문구와 파비콘 수정.",
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-border bg-card p-6 transition hover:border-accent/40"
          >
            <h2 className="text-lg font-semibold text-card-foreground">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
