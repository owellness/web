"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Download, Loader2, Share2 } from "lucide-react";

import { parseCode, TYPE_BY_CODE } from "@/application/owti";
import { SITE_NAME } from "@/config/site";
import { readResultAverages } from "@/presentation/lib/owtiResult";
import {
  canvasToPngBlob,
  drawOwtiShareCard,
  type OwtiCardData,
  OWTI_CARD_HEIGHT,
  OWTI_CARD_WIDTH,
  shareCardFileName,
} from "@/presentation/lib/owtiShareCard";

const noopSubscribe = () => () => {};

// false during SSR + the first hydration render, true thereafter — so the
// browser-only reads below never run on the server (avoids hydration mismatch).
function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

type Status = "loading" | "ready" | "error";

export function OwtiShareCard({ code }: { code: string }) {
  const mounted = useMounted();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const data = useMemo<OwtiCardData | null>(() => {
    const type = TYPE_BY_CODE[code];
    if (!type) return null;

    const averages = mounted ? readResultAverages(code) : null;
    const domains = parseCode(code).map((p, i) => ({
      name: p.domain.name,
      letter: p.letter,
      isStrong: p.isStrong,
      poleName: p.isStrong ? p.domain.strong.name : p.domain.weak.name,
      average: averages ? (averages[i] ?? null) : null,
    }));

    return {
      code,
      emoji: type.emoji,
      name: type.name,
      tagline: type.tagline,
      domains,
      hasScores: Boolean(averages),
      siteName: SITE_NAME,
      siteHost: mounted ? window.location.host : "",
    };
  }, [code, mounted]);

  const renderCard = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return null;
    const family = getComputedStyle(document.body).fontFamily;
    await drawOwtiShareCard(canvas, data, family);
    return canvas;
  }, [data]);

  // Draw the preview once mounted and whenever the resolved data changes.
  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    renderCard()
      .then((canvas) => {
        if (!cancelled) setStatus(canvas ? "ready" : "error");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [data, renderCard]);

  const exportBlob = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    try {
      if (status !== "ready") await renderCard();
      return await canvasToPngBlob(canvas);
    } catch {
      return null;
    }
  }, [status, renderCard]);

  if (!data) return null;

  const fileName = shareCardFileName(code);
  const shareText = `${data.emoji} 나의 웰니스 유형은 ‘${data.name}’ (${code})! 나의 유형도 검사해보세요`;

  const handleDownload = async () => {
    setBusy(true);
    setNotice(null);
    const blob = await exportBlob();
    setBusy(false);
    if (!blob) {
      setNotice("이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setNotice("이미지를 저장했어요. 인스타그램 피드·스토리에 공유해보세요!");
  };

  const handleShare = async () => {
    setBusy(true);
    setNotice(null);
    const shareUrl = `${window.location.origin}/owti/result/${code}`;
    const blob = await exportBlob();
    const file = blob
      ? new File([blob], fileName, { type: "image/png" })
      : null;

    try {
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "웰니스 유형 검사 결과",
          text: shareText,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: "웰니스 유형 검사 결과",
          text: shareText,
          url: shareUrl,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setNotice("결과 링크를 복사했어요. 원하는 곳에 붙여넣어 공유하세요.");
      } else {
        setNotice("이 브라우저는 공유를 지원하지 않아요. ‘이미지 저장’을 이용해주세요.");
      }
    } catch (err) {
      // The user dismissing the native share sheet throws AbortError — ignore it.
      if ((err as Error)?.name !== "AbortError") {
        setNotice("공유에 실패했어요. ‘이미지 저장’을 이용해주세요.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-label="결과 이미지 저장 및 공유"
      className="mt-12 rounded-3xl border border-border bg-card p-6 text-center sm:p-8"
    >
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        내 웰니스 유형 카드
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
        인스타그램 피드 크기(1080×1350)로 만든 결과 카드예요. 저장하거나 바로
        공유해 나의 웰니스 유형을 자랑해보세요.
      </p>

      {/* Preview — the exact image that gets downloaded/shared. */}
      <div className="mx-auto mt-6 w-full max-w-[300px]">
        <div
          className="relative overflow-hidden rounded-2xl border border-border bg-muted/40 shadow-sm"
          style={{ aspectRatio: `${OWTI_CARD_WIDTH} / ${OWTI_CARD_HEIGHT}` }}
        >
          <canvas
            ref={canvasRef}
            width={OWTI_CARD_WIDTH}
            height={OWTI_CARD_HEIGHT}
            role="img"
            aria-label={`${data.name} (${code}) 웰니스 유형 카드`}
            className={[
              "h-full w-full transition-opacity duration-300",
              status === "ready" ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />
          {status !== "ready" ? (
            <div
              className="absolute inset-0 flex items-center justify-center"
              aria-hidden
            >
              {status === "error" ? (
                <span className="px-4 text-center text-xs text-muted-foreground">
                  미리보기를 불러오지 못했어요. 저장은 계속 시도할 수 있어요.
                </span>
              ) : (
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          이미지 저장
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
        >
          <Share2 className="size-4" />
          공유하기
        </button>
      </div>

      <p
        aria-live="polite"
        className="mt-3 min-h-5 text-sm text-muted-foreground"
      >
        {busy ? "이미지를 준비하고 있어요…" : notice}
      </p>
    </section>
  );
}
