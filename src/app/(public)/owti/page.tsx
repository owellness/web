import type { Metadata } from "next";
import Link from "next/link";

import {
  DOMAINS_IN_ORDER,
  TOTAL_QUESTIONS,
  TYPES,
} from "@/application/owti";
import {
  buildBreadcrumbJsonLd,
  buildPersonJsonLd,
} from "@/application/seo/jsonld";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { JsonLd } from "@/presentation/components/public/JsonLd";
import { MedicalDisclaimer } from "@/presentation/components/public/MedicalDisclaimer";

const OWTI_URL = `${SITE_URL}/owti`;

// Designer of the OWTI assessment and the external credentials cited on the
// landing page as a trust/E-E-A-T signal. The certification links point to the
// issuing bodies so readers can verify them directly.
const DESIGNER_NAME = "차민기";
const DESIGNER_URL = `${SITE_URL}/authors/minkicha`;
const CWP_CERT_URL =
  "https://www.wellnessalliance.org/cwp-certification/the-gold-standard-wellness-certification";
const IBLM_CERT_URL = "https://iblm.org/lifestyle-medicine-certification/";

const DESIGNER_PERSON_SCHEMA = buildPersonJsonLd({
  name: DESIGNER_NAME,
  url: DESIGNER_URL,
  bio: `웰니스 얼라이언스 CWP(The Gold Standard Wellness Certification)와 국제 생활습관의학 위원회(IBLM)의 생활습관의학 인증을 보유한 웰니스 전문가입니다. O! Wellness Type Indicator(OWTI) 검사를 설계했습니다.`,
  affiliation: SITE_NAME,
  sameAs: [DESIGNER_URL, CWP_CERT_URL, IBLM_CERT_URL],
});

const TITLE = "웰니스 유형 검사 · OWTI";
const DESCRIPTION = `O! Wellness Type Indicator — 4개 영역(실천·몸·마음·연결)과 ${TOTAL_QUESTIONS}문항으로 알아보는 나의 웰니스 유형. 16가지 타입 중 지금 나에게 필요한 변화의 방향을 찾아보세요.`;
const OG_IMAGE = `${SITE_URL}/api/og?title=${encodeURIComponent(
  "나의 웰니스 유형 검사",
)}&category=${encodeURIComponent("O! Wellness Type")}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: OWTI_URL },
  openGraph: {
    type: "website",
    url: OWTI_URL,
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function OwtiLandingPage() {
  return (
    <>
      <JsonLd
        schema={buildBreadcrumbJsonLd([
          { name: SITE_NAME, url: SITE_URL },
          { name: "웰니스 유형 검사", url: OWTI_URL },
        ])}
      />
      <JsonLd schema={DESIGNER_PERSON_SCHEMA} />

      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 md:py-24">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
            O! Wellness Type Indicator
          </p>
          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            나의 웰니스 유형을 알면,
            <br />
            변화의 방향이 보입니다
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            웰니스를 <strong className="text-foreground">실천 · 몸 · 마음 · 연결</strong>{" "}
            4개 영역으로 나누어, 나의 강점과 취약 영역을 4글자 코드로 알려드립니다.
            성격이 아닌 <strong className="text-foreground">지금의 생활습관</strong>을
            측정하기에, 몇 달 뒤엔 유형이 달라질 수 있어요.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/owti/test"
              className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-90"
            >
              무료로 검사 시작하기
            </Link>
            <Link
              href="#types"
              className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              16가지 유형 보기
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            {TOTAL_QUESTIONS}문항 · 약 1~3분 소요 · 회원가입 불필요
          </p>
        </div>
      </section>

      {/* Designed by an expert */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
            검사 설계
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            웰니스 전문가가 설계했습니다
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            OWTI는{" "}
            <Link
              href="/authors/minkicha"
              className="font-medium text-accent hover:underline"
            >
              {DESIGNER_NAME}
            </Link>
            가 설계했습니다. 아래 두 가지 국제 자격을 바탕으로{" "}
            <strong className="text-foreground">실천 · 몸 · 마음 · 연결</strong>{" "}
            4개 영역과 {TOTAL_QUESTIONS}문항의 검사 구조를 구성했습니다.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <a
              href={CWP_CERT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-border bg-card p-6 transition hover:border-accent/40"
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Wellness Alliance
              </p>
              <p className="mt-2 text-base font-semibold text-card-foreground">
                CWP · The Gold Standard Wellness Certification
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                웰니스 얼라이언스(Wellness Alliance)가 인증하는 웰니스 전문가
                (Certified Wellness Practitioner) 자격입니다.
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-accent group-hover:underline">
                자격 확인하기 →
              </span>
            </a>
            <a
              href={IBLM_CERT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-border bg-card p-6 transition hover:border-accent/40"
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                IBLM
              </p>
              <p className="mt-2 text-base font-semibold text-card-foreground">
                Lifestyle Medicine Certification
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                국제 생활습관의학 위원회(International Board of Lifestyle
                Medicine)의 생활습관의학 인증입니다.
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-accent group-hover:underline">
                자격 확인하기 →
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* 4 domains */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          4개 핵심 영역 — AFCH
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          각 영역은 12개 문항으로 측정됩니다. 평균 3.5점 이상이면 강점(●), 미만이면
          취약(○) 영역으로 분류돼요.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DOMAINS_IN_ORDER.map((d) => (
            <div
              key={d.key}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-full bg-accent/15 text-base font-bold text-accent">
                  {d.strong.letter}
                </span>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">
                    {d.name}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {d.english}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {d.description}
              </p>
              <p className="mt-4 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent">
                  ● {d.strong.name} {d.strong.letter}
                </span>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-400">
                  ○ {d.weak.name} {d.weak.letter}
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Code reading */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            코드 읽는 법
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            4글자 코드의 각 자리는 해당 영역의 강점(●) 또는 취약(○)을 나타냅니다.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DOMAINS_IN_ORDER.map((d) => (
              <div
                key={d.key}
                className="rounded-xl border border-border bg-card p-5 text-center"
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {d.position}번째 자리
                </p>
                <p className="mt-1 text-sm font-semibold text-card-foreground">
                  {d.name}
                </p>
                <div className="mt-3 flex items-center justify-center gap-3 text-sm">
                  <span className="font-bold text-accent">{d.strong.letter}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {d.weak.letter}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <p className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-card-foreground">
              <span className="font-mono font-bold text-accent">AFCH</span> = 실천●
              + 몸● + 마음● + 연결● →{" "}
              <strong>웰니스 마스터 🏆</strong>
            </p>
            <p className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-card-foreground">
              <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                PWTE
              </span>{" "}
              = 실천○ + 몸○ + 마음○ + 연결○ →{" "}
              <strong>전면 재충전 필요 🔋</strong>
            </p>
          </div>
        </div>
      </section>

      {/* 16 types */}
      <section id="types" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          16가지 웰니스 유형
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          궁금한 유형을 눌러 자세한 설명을 미리 볼 수 있어요. 검사를 마치면 나의
          유형으로 바로 안내해드립니다.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TYPES.map((t) => (
            <Link
              key={t.code}
              href={`/owti/result/${t.code}`}
              className="group rounded-2xl border border-border bg-card p-5 transition hover:border-accent/40 hover:bg-muted/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl" aria-hidden>
                  {t.emoji}
                </span>
                <span className="font-mono text-xs font-semibold tracking-widest text-muted-foreground">
                  {t.code}
                </span>
              </div>
              <p className="mt-3 text-base font-semibold text-card-foreground">
                {t.name}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t.tagline}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-8 text-center sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            나의 웰니스 유형은?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            지난 한 달을 떠올리며 {TOTAL_QUESTIONS}문항에 답해보세요. 결과는 기기에서
            바로 계산되며, 개별 응답은 저장되지 않습니다. 서비스 개선을 위한 익명
            통계(진행 단계·완료 유형)만 수집됩니다.
          </p>
          <Link
            href="/owti/test"
            className="mt-6 inline-flex rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background transition hover:opacity-90"
          >
            검사 시작하기
          </Link>
          <div className="mt-8 text-left">
            <MedicalDisclaimer variant="compact" />
          </div>
        </div>
      </section>
    </>
  );
}
