import { createArticleService } from "@/application/articles/service";
import { createAuthorService } from "@/application/authors/service";
import { createCategoryService } from "@/application/categories/service";
import { createNewsletterService } from "@/application/newsletter/service";
import { SITE_NAME, SITE_URL } from "@/config/site";

import { hmacConfirmTokenSigner } from "@/infrastructure/auth/hmacTokens";
import { nextRevalidation } from "@/infrastructure/cache/nextRevalidation";
import { slugify } from "@/infrastructure/content/slug";
import { tiptapHtmlRenderer } from "@/infrastructure/content/tiptapHtmlRenderer";
import { resendNewsletterMailer } from "@/infrastructure/email/newsletterMailer";
import { drizzleArticleRepository } from "@/infrastructure/repositories/drizzleArticleRepository";
import { drizzleAuthorRepository } from "@/infrastructure/repositories/drizzleAuthorRepository";
import { drizzleCategoryRepository } from "@/infrastructure/repositories/drizzleCategoryRepository";
import { drizzleSubscriberRepository } from "@/infrastructure/repositories/drizzleSubscriberRepository";

// Composition root. Presentation/App imports from here (and only from here)
// to obtain the Application services it needs.

export const articleService = createArticleService({
  repository: drizzleArticleRepository,
  htmlRenderer: tiptapHtmlRenderer,
  revalidation: nextRevalidation,
});

export const categoryService = createCategoryService(drizzleCategoryRepository);

export const authorService = createAuthorService({
  repository: drizzleAuthorRepository,
  slugify,
});

export const newsletterService = createNewsletterService({
  repository: drizzleSubscriberRepository,
  mailer: resendNewsletterMailer,
  tokens: hmacConfirmTokenSigner,
  brandName: SITE_NAME,
  buildConfirmUrl: (token) =>
    `${SITE_URL}/api/newsletter/confirm?token=${encodeURIComponent(token)}`,
  buildUnsubscribeUrl: (token) =>
    `${SITE_URL}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`,
});
