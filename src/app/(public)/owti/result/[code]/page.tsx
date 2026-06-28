import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ALL_CODES,
  DOMAIN_CATEGORY_SLUGS,
  parseCode,
  TYPE_BY_CODE,
  weakDomainsFromCode,
} from "@/application/owti";
import { buildBreadcrumbJsonLd } from "@/application/seo/jsonld";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { JsonLd } from "@/presentation/components/public/JsonLd";
import { MedicalDisclaimer } from "@/presentation/components/public/MedicalDisclaimer";
import { NewsletterCTA } from "@/presentation/components/public/NewsletterCTA";
import { OwtiScoreBreakdown } from "@/presentation/components/public/owti/OwtiScoreBreakdown";

import { categoryService } from "@/composition";

// Pre-render all 16 type pages at build; reject anything else with a 404.
export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return ALL_CODES.map((code) => ({ code }));
}

const resultUrl = (code: string) => `${SITE_URL}/owti/result/${code}`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const type = TYPE_BY_CODE[code.toUpperCase()];
  if (!type) return {};

  const title = `${type.name} (${type.code}) — 웰니스 유형 검사 결과`;
  const description = `${type.tagline}. ${type.description}`;
  const url = resultUrl(type.code);
  const ogImage = `${SITE_URL}/api/og?title=${encodeURIComponent(
    `${type.name} ${type.code}`,
  )}&category=${encodeURIComponent("O! Wellness Type")}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${type.emoji} ${type.name} · ${type.code}`,
      description,
      siteName: SITE_NAME,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${type.emoji} ${type.name} · ${type.code}`,
      description,
      images: [ogImage],
    },
  };
}

export default async function OwtiResultPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const type = TYPE_BY_CODE[code];
  if (!type) notFound();

  const composition = parseCode(code);

  // Recommend content for the type's weak (○) domains, intersected with the
  // categories that actually exist right now.
  const cats = await categoryService.listAll().catch(() => []);
  const catBySlug = new Map(cats.map((c) => [c.slug, c]));
  const weakDomains = weakDomainsFromCode(code);
  const recSlugs = [
    ...new Set(weakDomains.flatMap((d) => DOMAIN_CATEGORY_SLUGS[d.key])),
  ];
  const recCats = recSlugs
    .map((slug) => catBySlug.get(slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <>
      <JsonLd
        schema={buildBreadcrumbJsonLd([
          { name: SITE_NAME, url: SITE_URL },
          { name: "웰니스 유형 검사", url: `${SITE_URL}/owti` },
          { name: `${type.name} (${type.code})`, url: resultUrl(code) },
        ])}
      />

      <article className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6">
        <nav
          aria-label="breadcrumb"
          className="mb-6 text-sm text-muted-foreground"
        >
          <Link href="/" className="hover:text-foreground">
            홈
          </Link>
          <span aria-hidden> · </span>
          <Link href="/owti" className="hover:text-foreground">
            웰니스 유형 검사
          </Link>
        </nav>

        {/* Hero */}
        <header className="rounded-3xl border border-border bg-card p-8 text-center sm:p-10">
          <div className="text-6xl" aria-hidden>
            {type.emoji}
          </div>
          <div
            className="mt-4 flex items-center justify-center gap-1.5"
            aria-label={`유형 코드 ${type.code}`}
          >
            {composition.map((p, i) => (
              <span
                key={i}
                title={`${p.domain.name} — ${p.isStrong ? p.domain.strong.name : p.domain.weak.name}`}
                className={[
                  "flex size-9 items-center justify-center rounded-lg font-mono text-lg font-bold sm:size-10",
                  p.isStrong
                    ? "bg-accent/15 text-accent"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                ].join(" ")}
              >
                {p.letter}
              </span>
            ))}
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {type.name}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            “{type.tagline}”
          </p>
        </header>

        {/* Personalized score breakdown (client; from URL hash or the
            quiz's sessionStorage hand-off). */}
        <OwtiScoreBreakdown code={code} />

        {/* Description */}
        <section className="mt-12">
          <p className="text-lg leading-relaxed text-foreground">
            {type.description}
          </p>
        </section>

        {/* Strengths / Cautions / Tips */}
        <div className="mt-10 space-y-6">
          <ResultList
            title="강점"
            icon="✅"
            items={type.strengths}
            tone="accent"
          />
          <ResultList
            title="주의 사항"
            icon="⚠️"
            items={type.cautions}
            tone="amber"
          />
          <ResultList title="핵심 웰니스 팁" icon="💡" items={type.tips} tone="accent" />
        </div>

        {/* Recommended content (weak domains) — or a "maintain" note when the
            type has no weak domains at all (AFCH). */}
        {weakDomains.length === 0 ? (
          <section className="mt-12 rounded-2xl border border-accent/30 bg-accent/5 p-6">
            <p className="text-sm leading-relaxed text-foreground">
              4개 영역이 모두 강점이에요. 지금의 균형을 유지하면서, 완벽함보다{" "}
              <strong>지속성</strong>에 집중해보세요.
            </p>
          </section>
        ) : recCats.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              취약 영역에 도움이 되는 콘텐츠
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {weakDomains.map((d) => d.name).join(" · ")} 영역을 끌어올리는 데
              참고할 수 있는 {SITE_NAME} 콘텐츠예요.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {recCats.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${cat.slug}`}
                  className="group rounded-2xl border border-border bg-card p-5 transition hover:border-accent/40 hover:bg-muted/40"
                >
                  <p className="text-sm font-semibold text-card-foreground">
                    {cat.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {cat.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* CTAs */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/owti/test"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-90"
          >
            다시 검사하기
          </Link>
          <Link
            href="/owti#types"
            className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            다른 유형 보기
          </Link>
        </div>

        <NewsletterCTA source="owti-result" />

        <MedicalDisclaimer />
      </article>
    </>
  );
}

function ResultList({
  title,
  icon,
  items,
  tone,
}: {
  title: string;
  icon: string;
  items: readonly string[];
  tone: "accent" | "amber";
}) {
  const dot = tone === "accent" ? "text-accent" : "text-amber-600 dark:text-amber-400";
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-card-foreground">
        <span aria-hidden>{icon}</span>
        {title}
      </h2>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className={`mt-1 ${dot}`} aria-hidden>
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
