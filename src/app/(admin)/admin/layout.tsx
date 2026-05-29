import Link from "next/link";

import { SITE_NAME } from "@/config/site";
import { ThemeToggle } from "@/presentation/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/admin"
            className="text-sm font-semibold text-foreground"
          >
            {SITE_NAME} · 어드민
          </Link>
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link
              href="/admin/articles"
              className="rounded-md px-3 py-1.5 hover:bg-muted hover:text-foreground"
            >
              아티클
            </Link>
            <Link
              href="/admin/categories"
              className="rounded-md px-3 py-1.5 hover:bg-muted hover:text-foreground"
            >
              카테고리
            </Link>
            <Link
              href="/admin/subscribers"
              className="rounded-md px-3 py-1.5 hover:bg-muted hover:text-foreground"
            >
              구독자
            </Link>
            <Link
              href="/admin/newsletter"
              className="rounded-md px-3 py-1.5 hover:bg-muted hover:text-foreground"
            >
              발송
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}
