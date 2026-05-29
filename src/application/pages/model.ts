import { z } from "zod";

import { tiptapDocumentSchema, type TiptapDocument } from "@/application/articles/model";

export type SitePage = {
  id: string;
  slug: string;
  title: string;
  bodyHtml: string;
  bodyJson: TiptapDocument;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
};

export const sitePageInputSchema = z.object({
  title: z.string().min(1).max(200),
  bodyJson: tiptapDocumentSchema,
  seoTitle: z.string().max(200).nullable().optional(),
  seoDescription: z.string().max(300).nullable().optional(),
});

export type SitePageInput = z.infer<typeof sitePageInputSchema>;
