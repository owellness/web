import { ShieldCheck, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SITE_NAME, SITE_URL } from "@/config/site";
import { SajuInputForm } from "@/presentation/components/public/saju/SajuInputForm";

const SAJU_URL = `${SITE_URL}/saju`;
const TITLE = "O! 리듬 — 사주로 읽는 나의 웰니스";
const DESCRIPTION =
  "생년월일시의 명리 상징으로 활동·몸 돌봄·회복·관계의 리듬을 돌아보고, 이번 주에 시도할 작은 웰니스 습관을 찾아보세요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: SAJU_URL },
  openGraph: {
    type: "website",
    url: SAJU_URL,
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function SajuLandingPage() {
  return (
    <>
      <section className="overflow-hidden border-b border-border bg-[radial-gradient(circle_at_50%_0%,_color-mix(in_oklab,var(--accent)_18%,transparent),_transparent_60%)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_0.9fr] md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
              O! Rhythm · 명리 웰니스
            </p>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              타고난 리듬을 거울 삼아,
              <br className="hidden sm:block" /> 오늘의 나를 돌봐요
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              사주 명리의 상징으로 활동·몸 돌봄·회복·관계의 리듬을 돌아보고,
              이번 주에 시도할 작은 습관을 찾아보세요.
            </p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-background/70 px-3 py-1.5">
                무료 · 로그인 없음
              </span>
              <span className="rounded-full border border-border bg-background/70 px-3 py-1.5">
                출생 정보 서버 전송 없음
              </span>
              <span className="rounded-full border border-border bg-background/70 px-3 py-1.5">
                대한민국 양력 기준
              </span>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <div className="absolute inset-[12%] rounded-full border border-accent/20" />
            <div className="absolute inset-[25%] rounded-full border border-accent/30" />
            <div className="absolute inset-0 animate-[spin_40s_linear_infinite] rounded-full border border-dashed border-accent/25" />
            {[
              ["木", "top-[2%] left-1/2 -translate-x-1/2", "#4f7f5a"],
              ["火", "top-[31%] right-[1%]", "#c9654b"],
              ["土", "right-[15%] bottom-[5%]", "#ad843f"],
              ["金", "bottom-[5%] left-[15%]", "#6f7782"],
              ["水", "top-[31%] left-[1%]", "#4d7392"],
            ].map(([label, position, color]) => (
              <span
                key={label}
                className={`absolute flex size-14 items-center justify-center rounded-full border border-border bg-card font-serif text-xl shadow-sm ${position}`}
                style={{ color }}
              >
                {label}
              </span>
            ))}
            <div className="absolute inset-[34%] flex items-center justify-center rounded-full bg-foreground text-center text-background shadow-xl">
              <div>
                <Sparkles className="mx-auto size-5" aria-hidden />
                <p className="mt-2 text-sm font-semibold">나의 리듬</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
        <div className="lg:pt-8">
          <p className="text-sm font-semibold text-accent">시작하기</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            나의 명리 웰니스 리포트
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            이름과 성별은 필요하지 않아요. 출생 시간을 모르면 시주를 제외한
            6글자로 정직하게 해석 범위를 줄입니다.
          </p>
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-muted/60 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
            <p className="text-xs leading-relaxed text-muted-foreground">
              입력값은 계산 직후 폐기합니다. 결과 화면에는 생년월일과 시간을
              표시하지 않고, 공유 문구에도 포함하지 않습니다.
            </p>
          </div>
        </div>
        <SajuInputForm />
      </section>

      <section className="border-y border-border bg-muted/35">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <p className="text-sm font-semibold text-accent">리포트에서 만나는 것</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            유형이 아니라 성찰의 출발점
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {[
              ["01", "10가지 기본 캐릭터", "일간의 상징을 기억하기 쉬운 이미지와 질문으로 풀어드려요."],
              ["02", "오행 구성", "팔자에 나타난 글자를 있는 그대로 보여주고 계산 범위를 설명해요."],
              ["03", "작은 웰니스 실천", "단정적인 처방 대신 이번 주에 골라볼 행동을 제안해요."],
            ].map(([number, title, body]) => (
              <article key={number} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold tracking-widest text-accent">{number}</p>
                <h3 className="mt-3 font-semibold text-card-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="text-sm leading-7 text-muted-foreground">
          O! 리듬은 전통 명리를 활용한 자기성찰 콘텐츠입니다. 실제 성격이나 건강
          상태를 측정하는 검사가 아니며 의학적 진단과 조언을 대신하지 않습니다.
        </p>
        <Link href="/owti" className="mt-4 inline-flex text-sm font-medium text-accent hover:underline">
          현재 생활습관을 알아보는 OWTI 보기 →
        </Link>
      </section>
    </>
  );
}
