// Pure helpers for deriving Open Graph metadata from article body HTML.

/** First <img src> in the rendered article body, or null. */
export const extractFirstImageUrl = (html: string): string | null => {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
};

const decodeEntities = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

/**
 * Plain-text excerpt of the article body for og:description / twitter
 * description. Strips tags, collapses whitespace, and trims to `max` chars on a
 * word boundary.
 */
export const buildBodyExcerpt = (html: string, max = 200): string => {
  const text = decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
};
