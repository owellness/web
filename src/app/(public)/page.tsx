import Link from "next/link";

import { categoryService, settingsService } from "@/composition";
import { DEFAULT_SETTINGS } from "@/application/settings/model";

export const revalidate = 300; // ISR every 5 min

export default async function HomePage() {
  const [cats, settings] = await Promise.all([
    categoryService.listAll().catch(() => []),
    settingsService.get().catch(() => DEFAULT_SETTINGS),
  ]);
  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-20 sm:px-6 md:py-28">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            {settings.heroEyebrow}
          </p>
          <h1 className="max-w-3xl whitespace-pre-line text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            {settings.heroTitle}
          </h1>
          <p className="max-w-2xl whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
            {settings.heroSubtitle}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/newsletter"
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
            >
              뉴스레터 구독하기
            </Link>
            <Link
              href="/popular"
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              인기 콘텐츠 보기
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-accent/30 bg-accent/5">
          <div className="flex flex-col gap-6 p-8 sm:p-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                O! Wellness Type Indicator
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                나의 웰니스 유형은?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                실천 · 몸 · 마음 · 연결 4개 영역, 48문항으로 알아보는 나의 웰니스
                유형. 16가지 타입 중 지금 나에게 필요한 변화의 방향을 찾아보세요.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2">
              <Link
                href="/owti"
                className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-90"
              >
                무료로 검사 시작하기
              </Link>
              <span className="text-xs text-muted-foreground">
                약 1~3분 · 회원가입 불필요
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          카테고리
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cats.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${cat.slug}`}
              className="group rounded-2xl border border-border bg-card p-6 transition hover:border-accent/40 hover:bg-muted/40"
            >
              <h3 className="text-lg font-semibold text-card-foreground">
                {cat.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
