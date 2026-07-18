import { z } from "zod";
import type { CategorySlug } from "@/config/site";
import { SLUG_PATTERN } from "@/application/shared/slug";

export const ARTICLE_STATUS = ["draft", "published", "archived"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUS)[number];

export type TiptapDocument = {
  type: "doc";
  content?: unknown[];
};

export const tiptapDocumentSchema: z.ZodType<TiptapDocument> = z.object({
  type: z.literal("doc"),
  content: z.array(z.unknown()).optional(),
});

export type ArticleSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  status: ArticleStatus;
  publishedAt: Date | null;
  updatedAt: Date;
  primaryCategorySlug: CategorySlug;
  authorSlug: string;
  authorName: string;
  ogImageUrl: string | null;
  readingTimeSec: number;
  viewCount: number;
};

export type Article = ArticleSummary & {
  tldr: string[];
  contentJson: TiptapDocument;
  contentHtml: string;
  status: ArticleStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  tags: { slug: string; name: string }[];
  medicalReviewer: { slug: string; name: string } | null;
};

export const articleInputSchema = z.object({
  // Present when editing an existing article — drives id-based UPDATE so a
  // slug change doesn't accidentally insert a new row.
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(
      SLUG_PATTERN,
      "슬러그는 영문 소문자·숫자·하이픈만 사용할 수 있습니다. (한글은 자동 로마자 변환됩니다)",
    ),
  title: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(300),
  tldr: z.array(z.string().min(1).max(160)).max(6).default([]),
  contentJson: tiptapDocumentSchema,
  status: z.enum(ARTICLE_STATUS).default("draft"),
  primaryCategorySlug: z.string().min(1).max(80),
  tagSlugs: z.array(z.string().min(1).max(80)).max(10).default([]),
  authorId: z.string().uuid(),
  medicalReviewerId: z.string().uuid().nullable().optional(),
  ogImageUrl: z.string().url().nullable().optional(),
  seoTitle: z.string().max(200).nullable().optional(),
  seoDescription: z.string().max(300).nullable().optional(),
  canonicalUrl: z.string().url().nullable().optional(),
});

export type ArticleInput = z.infer<typeof articleInputSchema>;
