// Client-only renderer for the OWTI "wellness type" share card.
//
// Draws a 1080×1350 image — Instagram's portrait feed size (4:5) — onto a
// canvas so a user can download it and post their result, or hand it to the
// Web Share sheet. We render in the browser (not via next/og) on purpose: the
// page font (Pretendard, loaded as woff2) draws Korean type names and native
// colour emoji correctly here, whereas satori's bundled font has no Hangul.

import { SCALE_MAX, STRONG_THRESHOLD } from "@/application/owti";

/** Instagram portrait feed post — the largest in-feed size (4:5). */
export const OWTI_CARD_WIDTH = 1080;
export const OWTI_CARD_HEIGHT = 1350;

export type OwtiCardDomain = {
  /** Korean domain name, e.g. "실천의 힘". */
  name: string;
  /** Resolved single-letter code, e.g. "A" / "P". */
  letter: string;
  isStrong: boolean;
  /** Resolved pole name, e.g. "Active" / "Passive". */
  poleName: string;
  /** Personal average (1–5), or null when the visitor hasn't taken the test. */
  average: number | null;
};

export type OwtiCardData = {
  code: string;
  emoji: string;
  name: string;
  tagline: string;
  /** Four domains in code order (Action → Fitness → Calm → Heart). */
  domains: OwtiCardDomain[];
  /** True when personal per-domain scores are available. */
  hasScores: boolean;
  /** Brand name for the footer, e.g. "오! 웰니스". */
  siteName: string;
  /** Host shown in the footer, e.g. "owellness.kr" (may be empty). */
  siteHost: string;
};

const COLORS = {
  bgTop: "#fcfbf8",
  bgMid: "#f1ede5",
  bgBottom: "#e6e0d4",
  ink: "#14110f",
  muted: "#6b6258",
  faint: "#9a9082",
  accent: "#3b7a57",
  accentSoft: "#e4efe8",
  strong: "#3b7a57",
  weak: "#b9770f",
  weakSoft: "#f7ecd6",
  track: "#e7e2d6",
  line: "#ded8ca",
} as const;

// Append colour-emoji families so the type glyph falls back to the OS emoji
// font (Pretendard itself has no emoji coverage).
const EMOJI_STACK =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

const MARGIN = 108; // left/right content inset for rows and footer

type Ctx = CanvasRenderingContext2D;

function roundRectPath(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function setLetterSpacing(ctx: Ctx, value: string): void {
  // Supported in current Chrome/Safari/Firefox; ignored (harmlessly) elsewhere.
  if ("letterSpacing" in ctx) ctx.letterSpacing = value;
}

/**
 * Greedy word/character wrap. Breaks at spaces when it can (keeps Latin words
 * whole) and falls back to per-character breaks for long unbroken runs, which
 * is also the natural behaviour for Korean. Caps the result at `maxLines`.
 */
function wrapText(
  ctx: Ctx,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    if (lines.length >= maxLines) break;
    const test = line + ch;
    if (line && ctx.measureText(test).width > maxWidth) {
      const sp = line.lastIndexOf(" ");
      if (sp > 0) {
        lines.push(line.slice(0, sp));
        line = line.slice(sp + 1) + ch;
      } else {
        lines.push(line);
        line = ch === " " ? "" : ch;
      }
    } else {
      line = test;
    }
  }
  if (line.trim() && lines.length < maxLines) lines.push(line);
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, maxLines);
}

/**
 * Render the share card onto `canvas`. Resolves once drawing is complete.
 * `fontFamily` should be the page's computed font stack (Pretendard) so Korean
 * text matches the site.
 */
export async function drawOwtiShareCard(
  canvas: HTMLCanvasElement,
  data: OwtiCardData,
  fontFamily: string,
): Promise<void> {
  canvas.width = OWTI_CARD_WIDTH;
  canvas.height = OWTI_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // Wait for the webfont so the first paint isn't drawn with a system fallback.
  try {
    await document.fonts.ready;
  } catch {
    /* FontFaceSet unsupported — draw with whatever is available */
  }

  const W = OWTI_CARD_WIDTH;
  const H = OWTI_CARD_HEIGHT;
  const cx = W / 2;
  const family = `${fontFamily || "sans-serif"}, ${EMOJI_STACK}`;
  const font = (weight: number, size: number) => {
    ctx.font = `${weight} ${size}px ${family}`;
  };

  // Background.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, COLORS.bgTop);
  bg.addColorStop(0.55, COLORS.bgMid);
  bg.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Soft accent blooms, top-right and bottom-left.
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  ctx.arc(W - 36, 56, 240, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(64, H - 56, 210, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 1) Brand eyebrow.
  setLetterSpacing(ctx, "6px");
  font(700, 25);
  ctx.fillStyle = COLORS.accent;
  ctx.fillText("O! WELLNESS TYPE", cx, 98);
  setLetterSpacing(ctx, "0px");

  // 2) Type emoji.
  font(400, 150);
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(data.emoji, cx, 252);

  // 3) Code chips (one per domain, coloured by strength).
  const chip = 74;
  const gap = 16;
  const n = data.domains.length;
  const rowW = n * chip + (n - 1) * gap;
  let chipX = cx - rowW / 2;
  const chipY = 352;
  data.domains.forEach((d) => {
    roundRectPath(ctx, chipX, chipY, chip, chip, 18);
    ctx.fillStyle = d.isStrong ? COLORS.accentSoft : COLORS.weakSoft;
    ctx.fill();
    font(800, 38);
    ctx.fillStyle = d.isStrong ? COLORS.strong : COLORS.weak;
    ctx.fillText(d.letter, chipX + chip / 2, chipY + chip / 2 + 2);
    chipX += chip + gap;
  });

  // 4) Type name (1–2 lines).
  let y = 500;
  font(800, 62);
  ctx.fillStyle = COLORS.ink;
  for (const ln of wrapText(ctx, data.name, 900, 2)) {
    ctx.fillText(ln, cx, y);
    y += 74;
  }

  // 5) Tagline.
  y += 2;
  font(400, 30);
  ctx.fillStyle = COLORS.muted;
  for (const ln of wrapText(ctx, `“${data.tagline}”`, 860, 2)) {
    ctx.fillText(ln, cx, y);
    y += 42;
  }

  // 6) Divider.
  y += 16;
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 54, y);
  ctx.lineTo(cx + 54, y);
  ctx.stroke();
  y += 46;

  const contentL = MARGIN;
  const contentR = W - MARGIN;
  const barW = contentR - contentL;

  if (data.hasScores) {
    font(700, 26);
    ctx.fillStyle = COLORS.muted;
    ctx.textAlign = "center";
    ctx.fillText("나의 영역별 점수", cx, y);
    y += 54;

    const rowH = 92;
    data.domains.forEach((d) => {
      const avg = d.average ?? 0;
      const pct = Math.max(0, Math.min(1, avg / SCALE_MAX));
      const color = d.isStrong ? COLORS.strong : COLORS.weak;

      ctx.textBaseline = "middle";

      // Strength dot + domain name (left).
      ctx.beginPath();
      ctx.arc(contentL + 7, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.textAlign = "left";
      font(700, 30);
      ctx.fillStyle = COLORS.ink;
      ctx.fillText(d.name, contentL + 28, y);

      // Score (right).
      ctx.textAlign = "right";
      font(500, 24);
      ctx.fillStyle = COLORS.faint;
      ctx.fillText("/ 5", contentR, y);
      font(700, 30);
      ctx.fillStyle = color;
      ctx.fillText(avg.toFixed(1), contentR - 48, y);

      // Bar with a 3.5 threshold tick.
      const barY = y + 28;
      roundRectPath(ctx, contentL, barY, barW, 16, 8);
      ctx.fillStyle = COLORS.track;
      ctx.fill();
      roundRectPath(ctx, contentL, barY, Math.max(16, barW * pct), 16, 8);
      ctx.fillStyle = color;
      ctx.fill();
      const tickX = contentL + barW * (STRONG_THRESHOLD / SCALE_MAX);
      ctx.strokeStyle = "rgba(20, 17, 15, 0.28)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tickX, barY - 4);
      ctx.lineTo(tickX, barY + 20);
      ctx.stroke();

      y += rowH;
    });
  } else {
    // No personal scores — show the strong/weak composition from the code.
    font(700, 26);
    ctx.fillStyle = COLORS.muted;
    ctx.textAlign = "center";
    ctx.fillText("나의 웰니스 구성", cx, y);
    y += 54;

    const rowH = 84;
    data.domains.forEach((d) => {
      const color = d.isStrong ? COLORS.strong : COLORS.weak;
      ctx.textBaseline = "middle";

      ctx.beginPath();
      ctx.arc(contentL + 7, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.textAlign = "left";
      font(700, 30);
      ctx.fillStyle = COLORS.ink;
      ctx.fillText(d.name, contentL + 28, y);

      ctx.textAlign = "right";
      font(700, 26);
      ctx.fillStyle = color;
      ctx.fillText(`${d.isStrong ? "강점" : "취약"} · ${d.poleName}`, contentR, y);

      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(contentL, y + 30);
      ctx.lineTo(contentR, y + 30);
      ctx.stroke();

      y += rowH;
    });

    y += 10;
    font(500, 24);
    ctx.fillStyle = COLORS.faint;
    ctx.textAlign = "center";
    for (const ln of wrapText(
      ctx,
      "48문항 검사를 완료하면 영역별 점수가 카드에 함께 담겨요.",
      860,
      2,
    )) {
      ctx.fillText(ln, cx, y);
      y += 32;
    }
  }

  // Footer.
  const footerLineY = H - 132;
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(contentL, footerLineY);
  ctx.lineTo(contentR, footerLineY);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  font(800, 30);
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(data.siteName, cx, footerLineY + 44);
  font(500, 23);
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(
    data.siteHost
      ? `${data.siteHost} · 나의 웰니스 유형 검사`
      : "나의 웰니스 유형 검사",
    cx,
    footerLineY + 82,
  );
}

/** Encode the current canvas contents as a PNG Blob. */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("이미지를 생성하지 못했습니다."));
    }, "image/png");
  });
}

/** Download-friendly file name for a type's card, e.g. "owti-afch.png". */
export function shareCardFileName(code: string): string {
  return `owti-${code.toLowerCase()}.png`;
}
