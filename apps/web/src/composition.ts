import { createAppAuthService } from "@/application/appAuth/service";
import { createArticleService } from "@/application/articles/service";
import { createAuthorService } from "@/application/authors/service";
import { createCategoryService } from "@/application/categories/service";
import { createFaqService } from "@/application/faq/service";
import { createExternalContentService } from "@/application/externalContent/service";
import { createMediaService } from "@/application/media/service";
import { createNewsletterService } from "@/application/newsletter/service";
import { createOwtiAnalyticsService } from "@/application/owtiAnalytics/service";
import { createOwtiResultService } from "@/application/owtiResults/service";
import { createPageService } from "@/application/pages/service";
import { createSearchService } from "@/application/search/service";
import { createSettingsService } from "@/application/settings/service";
import { createTagService } from "@/application/tags/service";
import { SITE_NAME, SITE_URL } from "@/config/site";

import { appJwtIssuer } from "@/infrastructure/auth/appJwt";
import { hmacConfirmTokenSigner } from "@/infrastructure/auth/hmacTokens";
import { kakaoOpenApiVerifier } from "@/infrastructure/auth/kakaoOpenApi";
import { nextRevalidation } from "@/infrastructure/cache/nextRevalidation";
import { tiptapCampaignRenderer } from "@/infrastructure/content/campaignHtmlRenderer";
import { slugify } from "@/infrastructure/content/slug";
import { tiptapHtmlRenderer } from "@/infrastructure/content/tiptapHtmlRenderer";
import { papagoTranslator } from "@/infrastructure/contentIngestion/papagoTranslator";
import { rssFeedReader } from "@/infrastructure/contentIngestion/rssFeedReader";
import { externalFeedSources } from "@/infrastructure/contentIngestion/sources";
import {
  resendNewsletterBroadcaster,
  resendNewsletterMailer,
} from "@/infrastructure/email/newsletterMailer";
import { drizzleAppUserRepository } from "@/infrastructure/repositories/drizzleAppUserRepository";
import { drizzleArticleRepository } from "@/infrastructure/repositories/drizzleArticleRepository";
import { drizzleAuthorRepository } from "@/infrastructure/repositories/drizzleAuthorRepository";
import { drizzleCampaignRepository } from "@/infrastructure/repositories/drizzleCampaignRepository";
import { drizzleCategoryRepository } from "@/infrastructure/repositories/drizzleCategoryRepository";
import { drizzleFaqRepository } from "@/infrastructure/repositories/drizzleFaqRepository";
import { drizzleExternalContentRepository } from "@/infrastructure/repositories/drizzleExternalContentRepository";
import { drizzleOwtiEventRepository } from "@/infrastructure/repositories/drizzleOwtiEventRepository";
import { drizzleOwtiResultRepository } from "@/infrastructure/repositories/drizzleOwtiResultRepository";
import { drizzlePageRepository } from "@/infrastructure/repositories/drizzlePageRepository";
import { drizzleSettingsRepository } from "@/infrastructure/repositories/drizzleSettingsRepository";
import { drizzleSubscriberRepository } from "@/infrastructure/repositories/drizzleSubscriberRepository";
import { drizzleTagRepository } from "@/infrastructure/repositories/drizzleTagRepository";
import { postgresFtsAdapter } from "@/infrastructure/search/postgresFtsAdapter";
import { blobMediaUploadAdapter } from "@/infrastructure/storage/blobClient";

// Composition root. Presentation/App imports from here (and only from here)
// to obtain the Application services it needs.

export const articleService = createArticleService({
  repository: drizzleArticleRepository,
  htmlRenderer: tiptapHtmlRenderer,
  revalidation: nextRevalidation,
});

export const categoryService = createCategoryService(drizzleCategoryRepository);

export const faqService = createFaqService(drizzleFaqRepository);

export const externalContentService = createExternalContentService({
  sources: externalFeedSources,
  feedReader: rssFeedReader,
  translator: papagoTranslator,
  repository: drizzleExternalContentRepository,
  revalidation: nextRevalidation,
});

export const owtiAnalyticsService = createOwtiAnalyticsService(
  drizzleOwtiEventRepository,
);

export const pageService = createPageService({
  repository: drizzlePageRepository,
  htmlRenderer: tiptapHtmlRenderer,
});

export const authorService = createAuthorService({
  repository: drizzleAuthorRepository,
  slugify,
});

export const tagService = createTagService(drizzleTagRepository);

export const searchService = createSearchService(postgresFtsAdapter);

export const settingsService = createSettingsService(drizzleSettingsRepository);

export const mediaService = createMediaService(blobMediaUploadAdapter);

export const newsletterService = createNewsletterService({
  repository: drizzleSubscriberRepository,
  campaigns: drizzleCampaignRepository,
  mailer: resendNewsletterMailer,
  broadcaster: resendNewsletterBroadcaster,
  htmlRenderer: tiptapCampaignRenderer,
  tokens: hmacConfirmTokenSigner,
  brandName: SITE_NAME,
  buildConfirmUrl: (token) =>
    `${SITE_URL}/api/newsletter/confirm?token=${encodeURIComponent(token)}`,
  buildUnsubscribeUrl: (token) =>
    `${SITE_URL}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`,
});

// ── 모바일 앱 API v1 ─────────────────────────────────────────

export const appAuthService = createAppAuthService({
  verifier: kakaoOpenApiVerifier,
  users: drizzleAppUserRepository,
  tokens: appJwtIssuer,
});

export const owtiResultService = createOwtiResultService(
  drizzleOwtiResultRepository,
);
