// Slug helper for the article admin. Accepts Korean + ASCII input and produces
// a URL-safe slug that round-trips through Next.js Link without forced
// encoding. Korean characters are preserved (modern search engines index them
// fine and Korean URLs are common on local services).

export const slugify = (input: string): string => {
  return input
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
};
