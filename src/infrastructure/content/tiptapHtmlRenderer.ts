import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import readingTime from "reading-time";

import type { HtmlRenderer } from "@/application/articles/ports";
import { sanitizeHtml } from "./sanitize";

// Shared extension list. MUST match the client editor's extensions so JSON
// output and rendered HTML stay consistent — otherwise image nodes (and any
// other non-StarterKit node) would be silently dropped here.
const extensions = [StarterKit, Image];

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
