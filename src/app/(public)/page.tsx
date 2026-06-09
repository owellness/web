import Link from "next/link";

import { categoryService, settingsService } from "@/composition";
import { DEFAULT_SETTINGS } from "@/application/settings/model";

export const revalidate = 300; // ISR every 5 min

export default async function HomePage() {
  const [cats, settings] = await Promise.all([
    categoryService.listAll().catch(() => []),
    settingsService.get().catch(() => DEFAULT_SETTINGS),
  ]);
  const ctaSlug = cats[0]?.slug;
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
            {ctaSlug ? (
              <Link
                href={`/${ctaSlug}`}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                인기 콘텐츠 보기
              </Link>
            ) : null}
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
