import Link from "next/link";

import { categoryService } from "@/composition";
import { SITE_NAME } from "@/config/site";
import { MobileNav } from "@/presentation/components/public/MobileNav";
import { ThemeToggle } from "@/presentation/components/ThemeToggle";

export async function SiteHeader() {
  const cats = await categoryService.listAll().catch(() => []);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="shrink-0 text-base font-semibold tracking-tight text-foreground sm:text-lg"
        >
          {SITE_NAME}
        </Link>
        <nav
          aria-label="주요 카테고리"
          className="hidden gap-1 text-sm text-muted-foreground md:flex"
        >
          {cats.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${cat.slug}`}
              className="whitespace-nowrap rounded-md px-3 py-2 transition hover:bg-muted hover:text-foreground"
            >
              {cat.name}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1 text-sm">
          <Link
            href="/popular"
            className="rounded-md px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            인기
          </Link>
          <Link
            href="/owti"
            className="hidden whitespace-nowrap rounded-md px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground md:inline-flex"
          >
            유형검사
          </Link>
          <Link
            href="/search"
            className="hidden whitespace-nowrap rounded-md px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground md:inline-flex"
          >
            검색
          </Link>
          <ThemeToggle />
          <Link
            href="/newsletter"
            className="ml-1 hidden whitespace-nowrap rounded-md bg-accent px-3 py-2 text-accent-foreground transition hover:opacity-90 md:inline-flex"
          >
            뉴스레터 구독
          </Link>
          <MobileNav cats={cats} />
        </div>
      </div>
    </header>
  );
}
