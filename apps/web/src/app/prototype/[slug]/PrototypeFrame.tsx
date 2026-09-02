"use client";

import { useState } from "react";

/**
 * Viewport presets. A Claude Design canvas export lays several artboards out
 * side by side, so "캔버스" (full width) is the default; the narrower presets
 * exist to check a single screen at a realistic device width.
 */
const VIEWPORTS = [
  { id: "canvas", label: "캔버스", width: null },
  { id: "phone", label: "모바일 · 390", width: 390 },
  { id: "tablet", label: "태블릿 · 834", width: 834 },
] as const;

type ViewportId = (typeof VIEWPORTS)[number]["id"];

export function PrototypeFrame({ src, title }: { src: string; title: string }) {
  const [viewport, setViewport] = useState<ViewportId>("canvas");
  const width = VIEWPORTS.find((v) => v.id === viewport)?.width ?? null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-1 rounded-full border border-border bg-card p-1">
        {VIEWPORTS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setViewport(option.id)}
            aria-pressed={viewport === option.id}
            className={
              viewport === option.id
                ? "rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
                : "rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-1 justify-center overflow-hidden rounded-lg border border-border bg-card">
        <iframe
          src={src}
          title={title}
          className={
            width
              ? "h-full w-full border-x border-border"
              : "h-full w-full border-0"
          }
          style={width ? { maxWidth: width } : undefined}
          // The export is our own static file, but it is generated design code
          // rather than app code — keep it in its own sandbox so it cannot
          // navigate the host page or reach app cookies.
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </>
  );
}
