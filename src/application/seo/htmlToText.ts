// Pure converter: Tiptap-rendered HTML → markdown-ish plain text suitable
// for llms-full.txt / RSS / plaintext alternates. Not a full markdown
// converter — handles the small set of block + inline elements StarterKit
// produces, which is what we actually emit.

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const stripInlineTags = (html: string): string =>
  decode(
    html
      .replace(/<(strong|b)\b[^>]*>(.*?)<\/\1>/gi, "**$2**")
      .replace(/<(em|i)\b[^>]*>(.*?)<\/\1>/gi, "*$2*")
      .replace(/<code\b[^>]*>(.*?)<\/code>/gi, "`$1`")
      .replace(/<a\b[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );

export const htmlToPlainText = (html: string): string => {
  return html
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, lvl, c) => {
      const hashes = "#".repeat(Number(lvl));
      return `\n\n${hashes} ${stripInlineTags(c)}\n`;
    })
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => `\n- ${stripInlineTags(c)}`)
    .replace(/<\/(ul|ol)>/gi, "\n")
    .replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_, c) => `\n\n${stripInlineTags(c)}`)
    .replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, c) => `\n\n> ${stripInlineTags(c)}`)
    .replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_, c) =>
      `\n\n\`\`\`\n${stripInlineTags(c)}\n\`\`\`\n`,
    )
    .replace(/<br\b[^>]*\/?>/gi, "\n")
    .replace(/<hr\b[^>]*\/?>/gi, "\n\n---\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};
