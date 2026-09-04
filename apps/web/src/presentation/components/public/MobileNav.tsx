"use client";

import { Menu, Search, Sparkles, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type NavCategory = {
  slug: string;
  name: string;
};

export function MobileNav({ cats }: { cats: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  // Close on outside click / Escape while open. Listeners are only attached
  // when the menu is open so they stay cheap when it isn't.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={containerRef} className="md:hidden">
      <button
        type="button"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        {open ? (
          <X className="size-5" aria-hidden />
        ) : (
          <Menu className="size-5" aria-hidden />
        )}
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-border bg-background shadow-lg"
        >
          <nav
            aria-label="모바일 메뉴"
            className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 text-sm sm:px-6"
          >
            {cats.length > 0 ? (
              <>
                <p className="px-3 pt-1 pb-0.5 text-xs font-semibold tracking-wide text-muted-foreground">
                  카테고리
                </p>
                {cats.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/${cat.slug}`}
                    onClick={close}
                    className="rounded-md px-3 py-2.5 text-foreground transition hover:bg-muted"
                  >
                    {cat.name}
                  </Link>
                ))}
                <div className="my-2 h-px bg-border" aria-hidden />
              </>
            ) : null}

            <Link
              href="/owti"
              onClick={close}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-foreground transition hover:bg-muted"
            >
              <Sparkles className="size-4 text-muted-foreground" aria-hidden />
              유형검사
            </Link>
            <Link
              href="/search"
              onClick={close}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-foreground transition hover:bg-muted"
            >
              <Search className="size-4 text-muted-foreground" aria-hidden />
              검색
            </Link>
            <Link
              href="/mypage"
              onClick={close}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-foreground transition hover:bg-muted"
            >
              <UserRound className="size-4 text-muted-foreground" aria-hidden />
              마이페이지
            </Link>
            <Link
              href="/newsletter"
              onClick={close}
              className="mt-1 rounded-md bg-accent px-3 py-2.5 text-center font-medium text-accent-foreground transition hover:opacity-90"
            >
              뉴스레터 구독
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
