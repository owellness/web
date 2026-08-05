import type { HtmlRenderer } from "@/application/articles/ports";
import { validationFailed } from "@/application/shared/errors";
import { formatZodError } from "@/application/shared/validationMessage";

import { DEFAULT_PAGES } from "./defaults";
import { sitePageInputSchema, type SitePage } from "./model";
import type { SitePageRepository } from "./ports";

export type PageServiceDeps = {
  repository: SitePageRepository;
  htmlRenderer: HtmlRenderer;
};

export const createPageService = ({ repository, htmlRenderer }: PageServiceDeps) => ({
  async listAll(): Promise<SitePage[]> {
    return repository.listAll();
  },

  async getBySlug(slug: string): Promise<SitePage | null> {
    return repository.findBySlug(slug);
  },

  // Public read with a safety net: serve the DB row when present, otherwise
  // render the in-code default (covers build time and pre-seed state) so the
  // page always renders. Returns null for unknown slugs.
  async getForPublic(slug: string): Promise<SitePage | null> {
    try {
      const page = await repository.findBySlug(slug);
      if (page) return page;
    } catch (e) {
      console.warn("[pageService.getForPublic]", e);
    }
    const def = DEFAULT_PAGES[slug];
    if (!def) return null;
    const { html } = await htmlRenderer.renderTiptapToHtml(def.bodyJson);
    return {
      id: `default-${slug}`,
      slug,
      title: def.title,
      bodyHtml: html,
      bodyJson: def.bodyJson,
      seoTitle: def.seoTitle,
      seoDescription: def.seoDescription,
      updatedAt: new Date(),
    };
  },

  // Seed any default page that doesn't exist yet (idempotent, by slug).
  async ensureSeeded(): Promise<void> {
    for (const [slug, def] of Object.entries(DEFAULT_PAGES)) {
      const existing = await repository.findBySlug(slug);
      if (existing) continue;
      const { html } = await htmlRenderer.renderTiptapToHtml(def.bodyJson);
      await repository.upsert({
        slug,
        title: def.title,
        bodyHtml: html,
        bodyJson: def.bodyJson,
        seoTitle: def.seoTitle,
        seoDescription: def.seoDescription,
      });
    }
  },

  async save(slug: string, rawInput: unknown): Promise<SitePage> {
    const parsed = sitePageInputSchema.safeParse(rawInput);
    if (!parsed.success) throw validationFailed(formatZodError(parsed.error));

    const { html } = await htmlRenderer.renderTiptapToHtml(parsed.data.bodyJson);
    return repository.upsert({
      slug,
      title: parsed.data.title,
      bodyHtml: html,
      bodyJson: parsed.data.bodyJson,
      seoTitle: parsed.data.seoTitle ?? null,
      seoDescription: parsed.data.seoDescription ?? null,
    });
  },
});

export type PageService = ReturnType<typeof createPageService>;
