import { romanize } from "es-hangul";

// Pure slug utility (browser/edge safe — no Node APIs).
//
// Produces a short, ASCII-only URL slug. Korean input is romanized via the
// Revised Romanization rules so that copy-pasting the URL stays short and
// readable instead of expanding into the URL-encoded form
// (%EC%B0%A8%EB%AF%BC%EA%B8%B0). Non-letter symbols are dropped, whitespace
// is converted to single hyphens.

export const slugify = (input: string): string => {
  if (!input) return "";
  // Romanize first so Korean characters become ASCII letters.
  const ascii = romanize(input.normalize("NFC"));
  return ascii
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // strip punctuation/symbols (keeps spaces + hyphens)
    .replace(/\s+/g, "-") // spaces -> hyphen
    .replace(/-+/g, "-") // collapse hyphens
    .replace(/^-+|-+$/g, "") // trim hyphens
    .slice(0, 160);
};

// Strict ASCII kebab-case: letters/digits separated by single hyphens.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Normalizes a slug coming from a URL param for DB lookup.
//
// Legacy rows may still hold Korean (NFC or NFD) slugs from before
// romanization was enabled, so the lookup tolerates both percent-encoded and
// non-ASCII forms.
export const decodeSlugForLookup = (raw: string): string => {
  let s = raw;
  for (let i = 0; i < 3 && /%[0-9A-Fa-f]{2}/.test(s); i += 1) {
    try {
      const decoded = decodeURIComponent(s);
      if (decoded === s) break;
      s = decoded;
    } catch {
      break;
    }
  }
  return s.normalize("NFC");
};
