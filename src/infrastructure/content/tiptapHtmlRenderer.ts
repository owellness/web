import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import readingTime from "reading-time";

import type { HtmlRenderer } from "@/application/articles/ports";
import { sanitizeHtml } from "./sanitize";

// Shared extension list used by the server renderer. The admin editor
// (client) uses the same StarterKit so JSON output and rendered HTML stay
// consistent.
const extensions = [StarterKit];

const stripTags = (html: string) => html.replace(/<[^>]+>/g, " ");

export const tiptapHtmlRenderer: HtmlRenderer = {
  async renderTiptapToHtml(json) {
    const rawHtml = generateHTML(json as JSONContent, extensions);
    const html = sanitizeHtml(rawHtml);

    const stats = readingTime(stripTags(html), { wordsPerMinute: 220 });
    const readingTimeSec = Math.max(60, Math.round(stats.time / 1000));

    return { html, readingTimeSec };
  },
};
