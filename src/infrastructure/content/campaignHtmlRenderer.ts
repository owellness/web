import type { CampaignHtmlRenderer } from "@/application/newsletter/ports";

import { tiptapHtmlRenderer } from "./tiptapHtmlRenderer";

// Reuses the article Tiptap renderer (StarterKit + Image, sanitized) to turn
// the campaign body JSON into safe HTML for the email shell.
export const tiptapCampaignRenderer: CampaignHtmlRenderer = {
  async render(contentJson) {
    const { html } = await tiptapHtmlRenderer.renderTiptapToHtml(contentJson);
    return html;
  },
};
