// Pure slug utility (no deps) — shared across layers.
//
// Accepts Korean + ASCII and produces a URL-safe slug. Korean characters are
// preserved: modern search engines (Google, Naver) index UTF-8 URLs fine and
// Korean slugs put the keyword right in the URL, which helps domestic SEO.

export const slugify = (input: string): string =>
  input
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "") // drop punctuation/symbols
    .replace(/\s+/g, "-") // spaces -> hyphen
    .replace(/-+/g, "-") // collapse hyphens
    .replace(/^-+|-+$/g, "") // trim hyphens
    .slice(0, 160);

// Unicode-aware slug shape: letters/numbers separated by single hyphens.
export const SLUG_PATTERN = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;

// Normalizes a slug coming from a URL param for DB lookup.
//
// Next.js usually decodes route params, but in some setups (middleware/proxy,
// certain runtimes) a non-ASCII segment arrives still percent-encoded, e.g.
// "%EC%B0%A8...". Stored slugs are always decoded + NFC, so we decode here
// (handling accidental double-encoding) and normalize to NFC before matching.
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

