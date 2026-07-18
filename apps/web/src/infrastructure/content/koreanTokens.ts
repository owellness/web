import { disassemble, getChoseong } from "es-hangul";

const collapseSpaces = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * Builds a single lowercase search blob for an article. Combines the original
 * text with jamo-decomposed and choseong-only variants so a simple ILIKE
 * query against this column matches Korean substring, jamo, and initial-
 * consonant queries without a tokenizer extension.
 */
export const buildArticleSearchBlob = (input: {
  title: string;
  excerpt: string;
  tldr: string[];
  contentText?: string;
}): string => {
  const base = [
    input.title,
    input.excerpt,
    input.tldr.join(" "),
    input.contentText ?? "",
  ]
    .join(" ")
    .toLowerCase();
  const jamo = disassemble(base);
  const cho = getChoseong(base);
  return collapseSpaces(`${base} ${jamo} ${cho}`);
};

/**
 * Normalizes a user query into a search pattern. Produces a primary pattern
 * (Korean substring) and a jamo pattern (matches our blob's jamo region).
 */
export const buildQueryTokens = (
  query: string,
): { raw: string; jamo: string; choseong: string } => {
  const raw = query.trim().toLowerCase();
  return {
    raw,
    jamo: disassemble(raw),
    choseong: getChoseong(raw),
  };
};
