// Generates a downloadable "wellness type" card image (1080×1350 PNG) for every
// one of the 16 OWTI types, into public/owti/cards/owti-<code>.png.
//
// Unlike the personal share card (src/presentation/lib/owtiShareCard.ts), which
// needs the visitor's own scores, these are *generic per-type* cards: they show
// each type's strong (●) / weak (○) domain composition, so the site owner can
// download all 16 at once for marketing / social use.
//
// Why a headless browser?  The card is canvas-drawn so Korean (Pretendard) and
// the type emoji render exactly like the live site. We draw the emoji from the
// bundled Twemoji SVGs (src/app/api/og/emojiSvg.ts) rather than a font glyph, so
// it works on a Linux box with no colour-emoji font installed.
//
// One-time setup, then run from the repo root:
//   npm i -D playwright-core           # or: pnpm add -D playwright-core
//   node scripts/generate-owti-cards.mjs
//
// Chromium resolution order: $CHROMIUM_PATH → playwright-core's bundled browser.
// (Playwright on the web/CI image ships Chromium under $PLAYWRIGHT_BROWSERS_PATH.)

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright-core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TYPES_TS = join(ROOT, "src/application/owti/types.ts");
const EMOJI_TS = join(ROOT, "src/app/api/og/emojiSvg.ts");
const FONT_FILE = join(ROOT, "src/app/fonts/PretendardVariable.woff2");
const OUT_DIR = join(ROOT, "public/owti/cards");

const W = 1080;
const H = 1350;
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "오! 웰니스";
const BRAND_DOMAIN = "owellness.co.kr";

// Four wellness domains in code order — mirrors src/application/owti/model.ts.
// Position i in the 4-letter code maps to DOMAINS[i]; a letter equal to
// `strong.letter` marks that domain as a strength.
const DOMAINS = [
  { name: "실천의 힘", strong: { letter: "A", name: "Active" }, weak: { letter: "P", name: "Passive" } },
  { name: "건강한 몸", strong: { letter: "F", name: "Fit" }, weak: { letter: "W", name: "Worn" } },
  { name: "고요한 중심", strong: { letter: "C", name: "Calm" }, weak: { letter: "T", name: "Tense" } },
  { name: "나를 채우는 것들", strong: { letter: "H", name: "Heartful" }, weak: { letter: "E", name: "Empty" } },
];

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
  line: "#ded8ca",
};

/** Pull {code, emoji, name, tagline} for all 16 types out of types.ts. */
function parseTypes(src) {
  const re =
    /code:\s*"([^"]+)",\s*emoji:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*tagline:\s*"([^"]+)"/g;
  const out = [];
  for (const m of src.matchAll(re)) {
    out.push({ code: m[1], emoji: m[2], name: m[3], tagline: m[4] });
  }
  return out;
}

/** Pull the emoji → Twemoji data-URI map out of emojiSvg.ts. */
function parseEmoji(src) {
  const re = /"([^"]+)":\s*"(data:image\/svg\+xml;base64,[^"]+)"/g;
  const out = {};
  for (const m of src.matchAll(re)) out[m[1]] = m[2];
  return out;
}

function buildHtml({ fontB64, data }) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>
  @font-face{
    font-family:'Pretendard';
    src:url('data:font/woff2;base64,${fontB64}') format('woff2');
    font-weight:45 920; font-style:normal; font-display:block;
  }
  html,body{margin:0;padding:0;background:#fff}
  canvas{display:block}
</style></head><body>
<canvas id="c" width="${W}" height="${H}"></canvas>
<script id="data" type="application/json">${JSON.stringify(data)}</script>
<script>
const DATA = JSON.parse(document.getElementById('data').textContent);
const { types: TYPES, domains: DOMAINS, emoji: EMOJI, colors: COLORS,
        siteName: SITE_NAME, brandDomain: BRAND_DOMAIN, W, H } = DATA;
const TYPE_BY_CODE = Object.fromEntries(TYPES.map(t => [t.code, t]));
const MARGIN = 108;
const FAMILY = "Pretendard, sans-serif";

function roundRectPath(ctx,x,y,w,h,r){
  const rr=Math.max(0,Math.min(r,w/2,h/2));
  ctx.beginPath();
  ctx.moveTo(x+rr,y);
  ctx.arcTo(x+w,y,x+w,y+h,rr);
  ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr);
  ctx.arcTo(x,y,x+w,y,rr);
  ctx.closePath();
}
function setLetterSpacing(ctx,v){ if('letterSpacing' in ctx) ctx.letterSpacing=v; }
function wrapText(ctx,text,maxWidth,maxLines){
  const lines=[]; let line="";
  for(const ch of text){
    if(lines.length>=maxLines) break;
    const test=line+ch;
    if(line && ctx.measureText(test).width>maxWidth){
      const sp=line.lastIndexOf(" ");
      if(sp>0){ lines.push(line.slice(0,sp)); line=line.slice(sp+1)+ch; }
      else { lines.push(line); line=ch===" "?"":ch; }
    } else { line=test; }
  }
  if(line.trim() && lines.length<maxLines) lines.push(line);
  return lines.map(l=>l.trim()).filter(Boolean).slice(0,maxLines);
}

const imgCache=new Map();
function loadImage(src){
  return new Promise((res,rej)=>{
    if(imgCache.has(src)) return res(imgCache.get(src));
    const im=new Image();
    im.onload=()=>{ imgCache.set(src,im); res(im); };
    im.onerror=()=>rej(new Error('emoji image failed'));
    im.src=src;
  });
}

async function drawCard(ctx, t){
  const cx=W/2;
  const font=(w,s)=>{ ctx.font=w+" "+s+"px "+FAMILY; };
  const comp=DOMAINS.map((d,i)=>({ d, isStrong: t.code[i]===d.strong.letter, letter: t.code[i] }));

  // Background gradient + soft accent blooms.
  ctx.clearRect(0,0,W,H);
  const bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,COLORS.bgTop); bg.addColorStop(0.55,COLORS.bgMid); bg.addColorStop(1,COLORS.bgBottom);
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.globalAlpha=0.07; ctx.fillStyle=COLORS.accent;
  ctx.beginPath(); ctx.arc(W-36,56,240,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(64,H-56,210,0,Math.PI*2); ctx.fill(); ctx.restore();

  ctx.textAlign="center"; ctx.textBaseline="middle";

  // Brand eyebrow.
  setLetterSpacing(ctx,"6px"); font(700,25); ctx.fillStyle=COLORS.accent;
  ctx.fillText("O! WELLNESS TYPE", cx, 98); setLetterSpacing(ctx,"0px");

  // Type emoji (Twemoji SVG image).
  const src=EMOJI[t.emoji];
  if(src){ const im=await loadImage(src); const S=150; ctx.drawImage(im, cx-S/2, 252-S/2, S, S); }
  else { font(400,150); ctx.fillStyle=COLORS.ink; ctx.fillText(t.emoji, cx, 252); }

  // Code chips, coloured by strength.
  const chip=74, gap=16, n=comp.length, rowW=n*chip+(n-1)*gap;
  let chipX=cx-rowW/2; const chipY=352;
  comp.forEach(c=>{
    roundRectPath(ctx,chipX,chipY,chip,chip,18);
    ctx.fillStyle=c.isStrong?COLORS.accentSoft:COLORS.weakSoft; ctx.fill();
    font(800,38); ctx.fillStyle=c.isStrong?COLORS.strong:COLORS.weak;
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(c.letter, chipX+chip/2, chipY+chip/2+2);
    chipX+=chip+gap;
  });

  // Type name (1–2 lines).
  let y=500; font(800,62); ctx.fillStyle=COLORS.ink; ctx.textAlign="center"; ctx.textBaseline="middle";
  for(const ln of wrapText(ctx,t.name,900,2)){ ctx.fillText(ln,cx,y); y+=74; }

  // Tagline.
  y+=2; font(400,30); ctx.fillStyle=COLORS.muted;
  for(const ln of wrapText(ctx,"“"+t.tagline+"”",860,2)){ ctx.fillText(ln,cx,y); y+=42; }

  // Divider.
  y+=16; ctx.strokeStyle=COLORS.line; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(cx-54,y); ctx.lineTo(cx+54,y); ctx.stroke(); y+=46;

  const contentL=MARGIN, contentR=W-MARGIN;
  font(700,26); ctx.fillStyle=COLORS.muted; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText("영역별 강점 · 보완점", cx, y); y+=62;

  // Per-domain strong/weak rows (no personal numbers): name on the left, a
  // coloured pill on the right marking strength + the English pole name.
  const rowH=94;
  comp.forEach(c=>{
    const color=c.isStrong?COLORS.strong:COLORS.weak;
    ctx.textBaseline="middle";
    ctx.beginPath(); ctx.arc(contentL+7,y,7,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
    ctx.textAlign="left"; font(700,32); ctx.fillStyle=COLORS.ink;
    ctx.fillText(c.d.name, contentL+30, y);

    const label=c.isStrong?"강점":"보완점";
    const poleEn=c.isStrong?c.d.strong.name:c.d.weak.name;
    const text=label+" · "+poleEn;
    font(700,24);
    const padX=22, ph=50, r=25;
    const tw=ctx.measureText(text).width, pw=tw+padX*2, px=contentR-pw, py=y-ph/2;
    roundRectPath(ctx,px,py,pw,ph,r);
    ctx.fillStyle=c.isStrong?COLORS.accentSoft:COLORS.weakSoft; ctx.fill();
    ctx.textAlign="left"; ctx.fillStyle=color; ctx.fillText(text, px+padX, y);
    y+=rowH;
  });

  // Footer.
  const footerLineY=H-132; ctx.strokeStyle=COLORS.line; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(contentL,footerLineY); ctx.lineTo(contentR,footerLineY); ctx.stroke();
  ctx.textAlign="center"; ctx.textBaseline="middle";
  font(800,30); ctx.fillStyle=COLORS.ink; ctx.fillText(SITE_NAME, cx, footerLineY+44);
  font(500,23); ctx.fillStyle=COLORS.muted;
  ctx.fillText(BRAND_DOMAIN+" · 웰니스 유형 검사", cx, footerLineY+82);
}

window.__renderCard = async (code) => {
  const t=TYPE_BY_CODE[code];
  if(!t) throw new Error("unknown code "+code);
  const canvas=document.getElementById("c");
  const ctx=canvas.getContext("2d");
  try{
    await document.fonts.load("800 62px Pretendard");
    await document.fonts.load("400 30px Pretendard");
    await document.fonts.ready;
  }catch(e){}
  await drawCard(ctx,t);
  return canvas.toDataURL("image/png");
};
</script></body></html>`;
}

async function resolveChromium() {
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) {
    return process.env.CHROMIUM_PATH;
  }
  try {
    const p = chromium.executablePath();
    if (p && existsSync(p)) return p;
  } catch {
    /* fall through */
  }
  return undefined; // let Playwright try its default
}

async function main() {
  const [typesSrc, emojiSrc, fontBuf] = await Promise.all([
    readFile(TYPES_TS, "utf8"),
    readFile(EMOJI_TS, "utf8"),
    readFile(FONT_FILE),
  ]);

  const types = parseTypes(typesSrc);
  const emoji = parseEmoji(emojiSrc);
  if (types.length !== 16) {
    throw new Error(`expected 16 OWTI types, parsed ${types.length}`);
  }
  const missing = types.filter((t) => !emoji[t.emoji]).map((t) => t.code);
  if (missing.length) {
    console.warn(`⚠ no bundled emoji SVG for: ${missing.join(", ")} (raw glyph)`);
  }

  const html = buildHtml({
    fontB64: fontBuf.toString("base64"),
    data: {
      types,
      domains: DOMAINS,
      emoji,
      colors: COLORS,
      siteName: SITE_NAME,
      brandDomain: BRAND_DOMAIN,
      W,
      H,
    },
  });

  await mkdir(OUT_DIR, { recursive: true });

  const executablePath = await resolveChromium();
  const browser = await chromium.launch({
    executablePath,
    args: ["--no-sandbox", "--disable-gpu", "--force-color-profile=srgb"],
  });
  const page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  for (const t of types) {
    const dataUrl = await page.evaluate((code) => window.__renderCard(code), t.code);
    const png = Buffer.from(dataUrl.split(",")[1], "base64");
    const file = join(OUT_DIR, `owti-${t.code.toLowerCase()}.png`);
    await writeFile(file, png);
    console.error(`  ✓ ${t.code}  ${t.emoji}  ${t.name}  (${png.length}B)`);
  }

  await browser.close();
  console.error(`\nwrote ${types.length} cards → ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
