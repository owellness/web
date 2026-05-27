import Link from "next/link";

import { CATEGORIES, SITE_NAME } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          {SITE_NAME}
        </Link>
        <nav
          aria-label="주요 카테고리"
          className="hidden gap-1 text-sm text-muted-foreground md:flex"
        >
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${cat.slug}`}
              className="rounded-md px-3 py-2 transition hover:bg-muted hover:text-foreground"
            >
              {cat.shortName}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/search"
            className="rounded-md px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            검색
          </Link>
          <Link
            href="/newsletter"
            className="rounded-md bg-accent px-3 py-2 text-accent-foreground transition hover:opacity-90"
          >
            뉴스레터 구독
          </Link>
        </div>
      </div>
    </header>
  );
}
