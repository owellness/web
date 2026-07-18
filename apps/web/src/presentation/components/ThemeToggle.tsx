"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const ORDER = ["light", "dark", "system"] as const;
type Choice = (typeof ORDER)[number];

const LABEL: Record<Choice, string> = {
  light: "라이트",
  dark: "다크",
  system: "시스템",
};

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // `resolvedTheme` is undefined on the server / first client render. We render
  // a placeholder matching the server output until next-themes hydrates.
  if (!resolvedTheme) {
    return (
      <button
        type="button"
        aria-label="테마 전환"
        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground"
      >
        <Sun className="size-4" aria-hidden />
      </button>
    );
  }

  const current = (theme as Choice) ?? "system";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const displayed = current === "system" ? (resolvedTheme as Choice) : current;
  const Icon =
    current === "system" ? Laptop : displayed === "dark" ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`테마 전환 (현재: ${LABEL[current]} · 다음: ${LABEL[next]})`}
      title={`${LABEL[current]} → ${LABEL[next]}`}
      className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
