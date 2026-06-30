import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { DOMAINS_IN_ORDER, TYPES } from "@/application/owti";
import { buildBreadcrumbJsonLd } from "@/application/seo/jsonld";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { JsonLd } from "@/presentation/components/public/JsonLd";
import { MedicalDisclaimer } from "@/presentation/components/public/MedicalDisclaimer";

import { authorService } from "@/composition";

// The designer card pulls 차민기 원장's photo from the admin-managed author
// profile, so re-fetch periodically rather than baking it in forever.
export const revalidate = 3600;

const OWTI_URL = `${SITE_URL}/owti`;
const TITLE = "웰니스 유형 검사 · OWTI";
const DESCRIPTION = `O! Wellness Type Indicator — 4개 영역(실천·몸·마음·연결)으로 알아보는 나의 웰니스 유형. 16가지 타입 중 지금 나에게 필요한 변화의 방향을 찾아보세요.`;
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

export default async function OwtiLandingPage() {
  // The "누가 설계했나요?" card photo comes from the author profile with slug
  // "minkicha" so it tracks /authors/minkicha. A missing DB or avatar falls
  // back to a monogram, keeping the page renderable everywhere.
  const designer = await authorService.findBySlug("minkicha").catch(() => null);

  return (
    <>
      <JsonLd
        schema={buildBreadcrumbJsonLd([
          { name: SITE_NAME, url: SITE_URL },
          { name: "웰니스 유형 검사", url: OWTI_URL },
        ])}
      />

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
          <div className="flex max-w-2xl flex-col gap-3 text-lg leading-relaxed text-muted-foreground">
            <p>
              OWTI(O! Wellness Type Indicator)는 지금 나의 생활습관을 측정해 강점과
              취약 영역을 4글자 코드로 보여줍니다.
            </p>
            <p>
              성격이 아닌 <strong className="text-foreground">지금의 행동</strong>을
              측정합니다. 행동은 바꿀 수 있습니다.
            </p>
          </div>
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
            약 1~3분 소요 · 회원가입 불필요
          </p>
        </div>
      </section>

      {/* What makes OWTI different */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            OWTI는 다른 검사와 무엇이 다른가요?
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>지금 내가 어떻게 살고 있는지를 4가지 영역으로 들여다봅니다.</p>
            <p>
              운동을 하고 있는지, 잠을 충분히 자는지, 스트레스를 풀어내고 있는지,
              나를 채우는 관계가 있는지. 모두{" "}
              <strong className="text-foreground">오늘 당장 바꿀 수 있는</strong>{" "}
              것들입니다.
            </p>
            <p>
              연구에 따르면 새로운 건강 습관은 평균 3~6개월이면 자리를 잡습니다.
              <Cite refs={[1, 2]} /> 3개월 뒤 다시 검사해보세요. 코드가 달라져
              있다면, 그게 변화의 증거입니다.
            </p>
          </div>
        </div>
      </section>

      {/* 4 domains */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          4개 핵심 영역 — AFCH
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          각 영역의 평균 점수로 측정됩니다. 평균 3.5점 이상이면 강점(●), 미만이면
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

      {/* Who designed it */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            누가 설계했나요?
          </h2>
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <AuthorAvatar
                avatarUrl={designer?.avatarUrl ?? null}
                name={designer?.displayName ?? "차민기 원장"}
              />
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-accent">
                  설계자
                </p>
                <p className="mt-1 text-xl font-semibold text-card-foreground">
                  차민기 원장
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  한의사 · 국제 생활습관의학회(IBLM) 전문의
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Wellness Alliance 공인 웰니스 전문가 (CWP)",
                "ACE 공인 강사",
                "FMS 공인 강사",
              ].map((credential) => (
                <span
                  key={credential}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {credential}
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              운동, 식이, 수면, 스트레스까지 몸과 마음을 함께 다루는 통합적
              웰니스를 임상 현장에서 실천해왔습니다.
            </p>
            <blockquote className="mt-5 border-l-2 border-accent pl-4 text-base font-medium italic leading-relaxed text-foreground">
              “선생님, 저 왜 알면서도 못 바꾸는 걸까요?”
            </blockquote>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              진료실에서 반복되던 질문입니다. 무엇을 바꿔야 하는지 모르는 게
              아니라, 지금 어디가 약한지 모르는 게 문제라고 봤습니다. OWTI는 그
              생각에서 시작했습니다.
            </p>
          </div>
        </div>
      </section>

      {/* Why you can trust it */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          왜 신뢰할 수 있나요?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          OWTI를 설계하며 지킨 다섯 가지 원칙입니다.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <TrustCard title="근거 기반으로 설계했습니다" wide>
            <p>
              OWTI의 4개 영역은 Wellness Alliance·IBLM 등 국제 웰니스 기관의 핵심
              건강 행동 프레임워크와 수십 년간 축적된 임상 연구를 기반으로
              설계됐습니다.
              <Cite refs={[3]} />
            </p>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {EVIDENCE.map((e, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-0.5 text-accent" aria-hidden>
                    •
                  </span>
                  <span>
                    {e.lead}
                    {e.stat ? (
                      <strong className="font-semibold text-accent">
                        {e.stat}
                      </strong>
                    ) : null}
                    {e.tail}
                    <Cite refs={[e.ref]} />
                  </span>
                </li>
              ))}
            </ul>
          </TrustCard>

          <TrustCard title="태도가 아닌 행동을 묻습니다">
            <p>
              “긍정적인 사람인가요?”가 아니라 “실수를 배움의 기회로
              받아들이나요?”를 묻습니다. 행동 기반 문항이 자기인식 기반보다 측정
              일관성이 높습니다.
              <Cite refs={[15]} />
            </p>
          </TrustCard>

          <TrustCard title="균형 있게 구성했습니다">
            <p>
              4개 영역과 12개 하위 요소를 고르게 다루어, 심리측정학적 신뢰도
              기준을 충족하는 구조입니다.
              <Cite refs={[16]} />
            </p>
          </TrustCard>

          <TrustCard title="응답은 저장되지 않습니다">
            <p>
              모든 계산은 기기 안에서 이루어집니다. 회원가입 없이 시작할 수
              있습니다.
            </p>
          </TrustCard>

          <TrustCard title="낮은 점수는 문제가 아닙니다">
            <p>
              지금 어디가 약한지 알면, 무엇부터 시작할지 보입니다. OWTI는 점수를
              매기는 게 아니라 방향을 찾는 도구입니다.
            </p>
          </TrustCard>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-8 text-center sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            나의 웰니스 유형은?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            지난 한 달을 떠올리며 솔직하게 답해보세요. 결과는 기기에서
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

      {/* References */}
      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            참고문헌
          </h2>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            References
          </p>
          <ol className="mt-6 list-none space-y-4 text-xs leading-relaxed text-muted-foreground">
            {REFERENCES.map(({ n, cites }) => (
              <li key={n} id={`ref-${n}`} className="scroll-mt-24">
                <div className="flex gap-2">
                  <span className="shrink-0 font-mono font-medium text-foreground/70">
                    [{n}]
                  </span>
                  <div className="space-y-1">
                    {cites.map((c, i) => (
                      <p key={i}>
                        {c.text}
                        {c.venue ? " " : ""}
                        {c.venue ? <em className="italic">{c.venue}</em> : null}
                        {c.detail ? c.detail : c.venue ? "." : ""}
                        {c.url ? (
                          <>
                            {" "}
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all text-accent/90 underline-offset-2 hover:text-accent hover:underline"
                            >
                              {c.url}
                            </a>
                          </>
                        ) : null}
                      </p>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

/** Inline superscript citation linking down to the references list. */
function Cite({ refs }: { refs: number[] }) {
  return (
    <sup className="whitespace-nowrap font-normal">
      {refs.map((n) => (
        <a
          key={n}
          href={`#ref-${n}`}
          aria-label={`참고문헌 ${n}번`}
          className="px-px text-accent no-underline hover:underline"
        >
          [{n}]
        </a>
      ))}
    </sup>
  );
}

/** Designer headshot for the "누가 설계했나요?" card — the admin-managed avatar
 * when present, otherwise a monogram derived from the name. */
function AuthorAvatar({
  avatarUrl,
  name,
}: {
  avatarUrl: string | null;
  name: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className="size-20 shrink-0 rounded-full border border-border object-cover"
      />
    );
  }
  return (
    <div
      aria-hidden
      className="flex size-20 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-2xl font-semibold text-muted-foreground"
    >
      {name.charAt(0)}
    </div>
  );
}

/** One "왜 신뢰할 수 있나요?" point. `wide` spans both columns on sm+. */
function TrustCard({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-6${
        wide ? " sm:col-span-2" : ""
      }`}
    >
      <h3 className="text-base font-semibold text-card-foreground">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

/** Evidence bullets for the "근거 기반으로 설계했습니다" card. The `stat`
 * segment is highlighted; an empty `stat` renders as plain prose. */
const EVIDENCE: { lead: string; stat: string; tail: string; ref: number }[] = [
  {
    lead: "규칙적인 신체 활동은 사망 위험을 최대 ",
    stat: "22%",
    tail: " 낮춥니다.",
    ref: 6,
  },
  {
    lead: "수면 7시간 미만은 사망 위험을 ",
    stat: "14%",
    tail: " 높입니다.",
    ref: 8,
  },
  {
    lead: "낙관적 태도는 평균 수명을 ",
    stat: "11~15%",
    tail: " 늘리는 것과 연관됩니다.",
    ref: 10,
  },
  {
    lead: "사회적 연결이 강한 사람은 생존 가능성이 ",
    stat: "50%",
    tail: " 높습니다.",
    ref: 13,
  },
  {
    lead: "삶의 목적의식이 높을수록 사망 위험이 낮습니다.",
    stat: "",
    tail: "",
    ref: 12,
  },
];

/** Citation entry: prose `text`, italicised `venue`, optional post-venue
 * `detail` (volume/pages), and an optional source `url`. */
type RefCitation = {
  text: string;
  venue?: string;
  detail?: string;
  url?: string;
};

const REFERENCES: { n: number; cites: RefCitation[] }[] = [
  {
    n: 1,
    cites: [
      {
        text: "Gardiner B, et al. (2024). Time to Form a Habit: A Systematic Review and Meta-Analysis of Health Behaviour Habit Formation and Its Determinants.",
        venue: "PMC",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11641623/",
      },
    ],
  },
  {
    n: 2,
    cites: [
      {
        text: "Keller J, et al. (2021). Habit formation following routine-based versus time-based cue planning: A randomized controlled trial.",
        venue: "British Journal of Health Psychology",
        url: "https://doi.org/10.1111/bjhp.12504",
      },
    ],
  },
  {
    n: 3,
    cites: [
      {
        text: "Dysinger WS, et al. (2024). Foundations of Lifestyle Medicine and its Evolution.",
        venue: "Mayo Clinic Proceedings: Innovations, Quality & Outcomes",
        url: "https://www.mcpiqojournal.org/article/S2542-4548(23)00075-9/fulltext",
      },
    ],
  },
  {
    n: 4,
    cites: [
      {
        text: "Polman E, et al. (2016). Curiosity as a driver of healthy behavior change. American Psychological Association Annual Convention.",
        url: "https://www.apa.org/news/press/releases/2016/08/curiosity-behavior",
      },
    ],
  },
  {
    n: 5,
    cites: [
      {
        text: "McEwan D, et al. (2016). The effects of goal setting on physical activity: A meta-analysis of randomized controlled trials.",
        venue: "British Journal of Health Psychology",
        detail: ", 21(2), 383–404.",
      },
      {
        text: "Shilts MK, et al. (2011). Goal setting as a health behavior change strategy in overweight and obese adults.",
        venue: "Patient Education and Counseling",
        url: "https://www.sciencedirect.com/science/article/abs/pii/S0738399111003855",
      },
    ],
  },
  {
    n: 6,
    cites: [
      {
        text: "Samitz G, et al. (2011). Physical Activity and All-cause Mortality: An Updated Meta-analysis with Different Intensity Categories.",
        venue: "European Journal of Epidemiology",
      },
    ],
  },
  {
    n: 7,
    cites: [
      {
        text: "WHO/FAO Expert Consultation. (2003). Diet, Nutrition and the Prevention of Chronic Diseases.",
        venue: "WHO Technical Report Series 916",
        url: "https://www.fao.org/4/ac911e/ac911e00.htm",
      },
    ],
  },
  {
    n: 8,
    cites: [
      {
        text: "Liu TZ, et al. (2016). Nighttime sleep duration, 24-hour sleep duration and risk of all-cause mortality among adults.",
        venue: "Scientific Reports",
        url: "https://www.nature.com/articles/srep21480",
      },
      {
        text: "Baranwal N, et al. (2025). Imbalanced sleep increases mortality risk by 14–34%: a meta-analysis.",
        venue: "GeroScience",
        url: "https://link.springer.com/article/10.1007/s11357-025-01592-y",
      },
    ],
  },
  {
    n: 9,
    cites: [
      {
        text: "Singh B, et al. (2023). Effectiveness of physical activity interventions for improving depression, anxiety and distress: an overview of systematic reviews.",
        venue: "PMC",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10579187/",
      },
      {
        text: "American Psychological Association. (2019). Mindfulness meditation: A research-proven way to reduce stress.",
        url: "https://www.apa.org/topics/mindfulness/meditation",
      },
    ],
  },
  {
    n: 10,
    cites: [
      {
        text: "Lee LO, et al. (2019). Optimism is associated with exceptional longevity in 2 epidemiologic cohorts of men and women.",
        venue: "PNAS",
        url: "https://www.pnas.org/doi/10.1073/pnas.1900712116",
      },
    ],
  },
  {
    n: 11,
    cites: [
      {
        text: "Sonnentag S. (2001). Work, Recovery Activities, and Individual Well-Being: A Diary Study.",
        venue: "Journal of Occupational Health Psychology",
      },
    ],
  },
  {
    n: 12,
    cites: [
      {
        text: "Hill PL, Turiano NA. (2014). Purpose in Life as a Predictor of Mortality Across Adulthood.",
        venue: "Psychological Science",
        detail: ", 25(7), 1482–1486.",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4224996/",
      },
    ],
  },
  {
    n: 13,
    cites: [
      {
        text: "Vila J. (2021). Social Support and Longevity: Meta-Analysis-Based Evidence and Psychobiological Mechanisms.",
        venue: "Frontiers in Psychology",
        url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8473615/",
      },
      {
        text: "Holt-Lunstad J, et al. (2010). Social relationships and mortality risk: a meta-analytic review.",
        venue: "PLOS Medicine",
      },
    ],
  },
  {
    n: 14,
    cites: [
      {
        text: "Maslach C, Leiter MP. (2016). Burnout. In Stress: Concepts, Cognition, Emotion, and Behavior.",
        venue: "Academic Press",
      },
    ],
  },
  {
    n: 15,
    cites: [
      {
        text: "Lam CW, et al. (2020). A global lifestyle assessment: Psychometric properties of the General Lifestyle Questionnaire.",
        venue: "ScienceDirect",
        url: "https://www.sciencedirect.com/science/article/abs/pii/S003329841930041X",
      },
      {
        text: "García-Hermoso A, et al. (2022). Validity and Reliability of the FANTASTIC Questionnaire.",
        venue: "PMC",
        url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9413330/",
      },
    ],
  },
  {
    n: 16,
    cites: [
      {
        text: "Streiner DL. (2003). Starting at the Beginning: An Introduction to Coefficient Alpha and Internal Consistency.",
        venue: "Journal of Personality Assessment",
        detail: ", 80(1), 99–103.",
        url: "https://doi.org/10.1207/S15327752JPA8001_18",
      },
    ],
  },
];
