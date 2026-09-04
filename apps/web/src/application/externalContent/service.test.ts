import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  ExternalFeedSource,
  TranslationCandidate,
} from "./model";
import type {
  ExternalContentRepositoryPort,
  ExternalTranslatorPort,
} from "./ports";
import { createExternalContentService } from "./service";

const candidate: TranslationCandidate = {
  id: "item-1",
  sourceKey: "nutritionfacts",
  externalId: "source-item-1",
  sourceUrl: "https://nutritionfacts.org/blog/example/",
  originalTitle: "Original title",
  originalExcerpt: "Original excerpt",
  sourceAuthor: null,
  sourcePublishedAt: new Date("2026-09-01T00:00:00Z"),
  contentHash: "a".repeat(64),
};

const source = (translationAllowed: boolean): ExternalFeedSource => ({
  key: "nutritionfacts",
  name: "NutritionFacts.org",
  homepageUrl: "https://nutritionfacts.org/blog/",
  feedUrl: "https://nutritionfacts.org/blog/feed/",
  allowedHosts: ["nutritionfacts.org"],
  translationAllowed,
});

const translator: ExternalTranslatorPort = {
  provider: "test",
  isConfigured: () => true,
  async translate(candidates) {
    return candidates.map((item) => ({
      id: item.id,
      contentHash: item.contentHash,
      translatedTitle: "번역 제목",
      translatedExcerpt: "번역 소개",
      provider: "test",
    }));
  },
};

test("304 responses still retry pending translations and preserve validators", async () => {
  let published = 0;
  let released = 0;
  let revalidated = 0;

  const repository = {
    tryAcquireSourceLease: async () => "lease-1",
    releaseSourceLease: async () => {
      released += 1;
    },
    getFeedState: async () => ({ etag: "saved-etag", lastModified: null }),
    applyTranslationPolicy: async () => 1,
    stageItem: async () => ({ changed: false, visibilityChanged: false }),
    listTranslationCandidates: async () => [candidate],
    publishTranslations: async (translations) => {
      published = translations.length;
      return translations.length;
    },
    markTranslationFailed: async () => undefined,
    markFeedSuccess: async (_source, etag) => {
      assert.equal(etag, "saved-etag");
    },
    markFeedFailure: async () => undefined,
    listPublished: async () => [],
  } satisfies ExternalContentRepositoryPort;

  const service = createExternalContentService({
    sources: [source(true)],
    feedReader: {
      fetch: async () => ({
        kind: "not-modified",
        etag: null,
        lastModified: null,
      }),
    },
    translator,
    repository,
    revalidation: {
      revalidateHome: async () => {
        revalidated += 1;
      },
    },
  });

  const report = await service.sync();

  assert.equal(report.sources[0]?.status, "not-modified");
  assert.equal(report.sources[0]?.translated, 1);
  assert.equal(published, 1);
  assert.equal(revalidated, 1);
  assert.equal(released, 1);
});

test("revoked source permission hides content without calling the translator", async () => {
  let revalidated = 0;
  let translated = false;

  const repository = {
    tryAcquireSourceLease: async () => "lease-2",
    releaseSourceLease: async () => undefined,
    getFeedState: async () => ({ etag: null, lastModified: null }),
    applyTranslationPolicy: async () => 2,
    stageItem: async () => ({ changed: false, visibilityChanged: false }),
    listTranslationCandidates: async () => {
      throw new Error("candidates_must_not_be_loaded");
    },
    publishTranslations: async () => 0,
    markTranslationFailed: async () => undefined,
    markFeedSuccess: async () => undefined,
    markFeedFailure: async () => undefined,
    listPublished: async () => {
      throw new Error("disallowed_content_must_not_be_queried");
    },
  } satisfies ExternalContentRepositoryPort;

  const service = createExternalContentService({
    sources: [source(false)],
    feedReader: {
      fetch: async () => ({
        kind: "not-modified",
        etag: null,
        lastModified: null,
      }),
    },
    translator: {
      provider: "test",
      isConfigured: () => true,
      translate: async () => {
        translated = true;
        return [];
      },
    },
    repository,
    revalidation: {
      revalidateHome: async () => {
        revalidated += 1;
      },
    },
  });

  const report = await service.sync();
  const publishedItems = await service.listPublished();

  assert.equal(report.sources[0]?.rightsPending, 2);
  assert.equal(translated, false);
  assert.deepEqual(publishedItems, []);
  assert.equal(revalidated, 1);
});

test("the active translator provider scopes policy changes and public reads", async () => {
  let policyProvider = "";
  let publishedProvider = "";
  let revalidated = 0;

  const repository = {
    tryAcquireSourceLease: async () => "lease-3",
    releaseSourceLease: async () => undefined,
    getFeedState: async () => ({ etag: null, lastModified: null }),
    applyTranslationPolicy: async (_source, _allowed, provider) => {
      policyProvider = provider;
      return 1;
    },
    stageItem: async () => ({ changed: false, visibilityChanged: false }),
    listTranslationCandidates: async () => [],
    publishTranslations: async () => 0,
    markTranslationFailed: async () => undefined,
    markFeedSuccess: async () => undefined,
    markFeedFailure: async () => undefined,
    listPublished: async (_limit, _sources, provider) => {
      publishedProvider = provider;
      return [];
    },
  } satisfies ExternalContentRepositoryPort;

  const service = createExternalContentService({
    sources: [source(true)],
    feedReader: {
      fetch: async () => ({
        kind: "not-modified",
        etag: null,
        lastModified: null,
      }),
    },
    translator: { ...translator, provider: "papago" },
    repository,
    revalidation: {
      revalidateHome: async () => {
        revalidated += 1;
      },
    },
  });

  const report = await service.sync();
  await service.listPublished();

  assert.equal(policyProvider, "papago");
  assert.equal(publishedProvider, "papago");
  assert.equal(report.sources[0]?.visibilityChanged, true);
  assert.equal(revalidated, 1);
});
