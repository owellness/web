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
