// Regenerates src/app/api/og/emojiSvg.ts: fetches the Twemoji SVG for every
// emoji used by the OWTI types and inlines them as base64 data URIs, so the
// /api/og card renders emoji without a runtime CDN fetch.
//
// Run from the repo root:  node scripts/generate-emoji-svg.mjs
//
// Source: twitter/twemoji (CC-BY 4.0). next/og's default `emoji` set is twemoji,
// so these match what satori would otherwise fetch from cdn.jsdelivr.net.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = join(ROOT, "src/application/owti/types.ts");
const OUT = join(ROOT, "src/app/api/og/emojiSvg.ts");
const BASE = "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg";

const ZWJ = 0x200d;
const VS16 = 0xfe0f;

// Mirror twemoji's grabTheRightIcon: drop U+FE0F unless the sequence has a ZWJ,
// then join lowercase hex codepoints with "-".
function twemojiCodepoints(emoji) {
  let cps = [...emoji].map((c) => c.codePointAt(0));
  if (!cps.includes(ZWJ)) cps = cps.filter((c) => c !== VS16);
  return cps.map((c) => c.toString(16)).join("-");
}

async function main() {
  const text = await readFile(TYPES, "utf8");
  const emojis = [];
  for (const m of text.matchAll(/emoji:\s*"([^"]+)"/g)) {
    if (!emojis.includes(m[1])) emojis.push(m[1]);
  }
  console.error(`found ${emojis.length} unique emoji`);

  const entries = [];
  for (const e of emojis) {
    const code = twemojiCodepoints(e);
    const res = await fetch(`${BASE}/${code}.svg`);
    if (!res.ok) throw new Error(`fetch ${code}.svg failed: ${res.status}`);
    const svg = Buffer.from(await res.arrayBuffer());
    entries.push([e, `data:image/svg+xml;base64,${svg.toString("base64")}`]);
    console.error(`  ${e}  U+${code}  ${svg.length}B`);
  }

  const body = [
    "// AUTO-GENERATED — do not edit by hand. Regenerate with",
    "// scripts/generate-emoji-svg.mjs (source: twitter/twemoji, CC-BY 4.0).",
    "//",
    "// Twemoji SVGs for the emojis rendered on /api/og cards, inlined as",
    "// base64 data URIs so the route never depends on a runtime CDN fetch",
    "// (satori's default `emoji` option pulls from cdn.jsdelivr.net at render",
    "// time, which fails silently when unreachable).",
    "export const EMOJI_SVG: Record<string, string> = {",
    ...entries.map(([e, uri]) => `  "${e}": "${uri}",`),
    "};",
    "",
  ].join("\n");
  await writeFile(OUT, body, "utf8");
  console.error(`wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
