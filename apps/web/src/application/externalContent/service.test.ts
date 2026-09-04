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
  originalBody: "Original body",
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
      translatedBody: "번역 본문",
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
    hasPendingBodyRefresh: async () => false,
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
    findPublishedById: async () => null,
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
    hasPendingBodyRefresh: async () => false,
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
    findPublishedById: async () => {
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
  let detailProvider = "";
  let detailSources: string[] = [];
  let detailReads = 0;
  let revalidated = 0;

  const repository = {
    tryAcquireSourceLease: async () => "lease-3",
    releaseSourceLease: async () => undefined,
    getFeedState: async () => ({ etag: null, lastModified: null }),
    hasPendingBodyRefresh: async () => false,
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
    findPublishedById: async (_id, sources, provider) => {
      detailReads += 1;
      detailProvider = provider;
      detailSources = sources;
      return null;
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
  await service.getPublishedById("not-a-uuid");
  await service.getPublishedById("123e4567-e89b-42d3-a456-426614174000");

  assert.equal(policyProvider, "papago");
  assert.equal(publishedProvider, "papago");
  assert.equal(detailProvider, "papago");
  assert.deepEqual(detailSources, ["nutritionfacts"]);
  assert.equal(detailReads, 1);
  assert.equal(report.sources[0]?.visibilityChanged, true);
  assert.equal(revalidated, 1);
});

test("one failed article does not discard successful translations from its source", async () => {
  const secondCandidate: TranslationCandidate = {
    ...candidate,
    id: "item-2",
    externalId: "source-item-2",
    sourceUrl: "https://nutritionfacts.org/blog/example-2/",
    contentHash: "b".repeat(64),
  };
  const failedIds: string[] = [];
  const publishedIds: string[] = [];
  let revalidated = 0;

  const repository = {
    tryAcquireSourceLease: async () => "lease-4",
    releaseSourceLease: async () => undefined,
    getFeedState: async () => ({ etag: "saved-etag", lastModified: null }),
    hasPendingBodyRefresh: async () => false,
    applyTranslationPolicy: async () => 0,
    stageItem: async () => ({ changed: false, visibilityChanged: false }),
    listTranslationCandidates: async () => [candidate, secondCandidate],
    publishTranslations: async (translations) => {
      publishedIds.push(...translations.map((translation) => translation.id));
      return translations.length;
    },
    markTranslationFailed: async (candidates) => {
      failedIds.push(...candidates.map((item) => item.id));
    },
    markFeedSuccess: async () => undefined,
    markFeedFailure: async () => undefined,
    listPublished: async () => [],
    findPublishedById: async () => null,
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
    translator: {
      ...translator,
      async translate(candidates) {
        if (candidates[0]?.id === candidate.id) {
          throw new Error("translator_bad_request");
        }
        return translator.translate(candidates);
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

  assert.equal(report.sources[0]?.status, "failed");
  assert.equal(report.sources[0]?.translated, 1);
  assert.deepEqual(failedIds, ["item-1"]);
  assert.deepEqual(publishedIds, ["item-2"]);
  assert.equal(revalidated, 1);
});

test("pending empty bodies bypass saved feed validators", async () => {
  let receivedState: unknown = "not-called";

  const repository = {
    tryAcquireSourceLease: async () => "lease-5",
    releaseSourceLease: async () => undefined,
    getFeedState: async () => ({ etag: "saved-etag", lastModified: null }),
    hasPendingBodyRefresh: async () => true,
    applyTranslationPolicy: async () => 1,
    stageItem: async () => ({ changed: false, visibilityChanged: false }),
    listTranslationCandidates: async () => [],
    publishTranslations: async () => 0,
    markTranslationFailed: async () => undefined,
    markFeedSuccess: async () => undefined,
    markFeedFailure: async () => undefined,
    listPublished: async () => [],
    findPublishedById: async () => null,
  } satisfies ExternalContentRepositoryPort;

  const service = createExternalContentService({
    sources: [source(true)],
    feedReader: {
      fetch: async (_source, state) => {
        receivedState = state;
        return { kind: "not-modified", etag: null, lastModified: null };
      },
    },
    translator,
    repository,
    revalidation: { revalidateHome: async () => undefined },
  });

  await service.sync();

  assert.equal(receivedState, null);
});

test("a systemic failure stops the batch and becomes its diagnostic code", async () => {
  const secondCandidate: TranslationCandidate = {
    ...candidate,
    id: "item-2",
    externalId: "source-item-2",
    sourceUrl: "https://nutritionfacts.org/blog/example-2/",
    contentHash: "b".repeat(64),
  };
  const thirdCandidate: TranslationCandidate = {
    ...candidate,
    id: "item-3",
    externalId: "source-item-3",
    sourceUrl: "https://nutritionfacts.org/blog/example-3/",
    contentHash: "c".repeat(64),
  };
  const failedIds: string[] = [];
  let translationCalls = 0;

  const repository = {
    tryAcquireSourceLease: async () => "lease-6",
    releaseSourceLease: async () => undefined,
    getFeedState: async () => ({ etag: "saved-etag", lastModified: null }),
    hasPendingBodyRefresh: async () => false,
    applyTranslationPolicy: async () => 0,
    stageItem: async () => ({ changed: false, visibilityChanged: false }),
    listTranslationCandidates: async () => [
      candidate,
      secondCandidate,
      thirdCandidate,
    ],
    publishTranslations: async () => 0,
    markTranslationFailed: async (candidates) => {
      failedIds.push(...candidates.map((item) => item.id));
    },
    markFeedSuccess: async () => undefined,
    markFeedFailure: async () => undefined,
    listPublished: async () => [],
    findPublishedById: async () => null,
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
    translator: {
      ...translator,
      async translate() {
        translationCalls += 1;
        if (translationCalls === 1) {
          throw new Error("translator_bad_request");
        }
        throw new Error("translator_network_error");
      },
    },
    repository,
    revalidation: { revalidateHome: async () => undefined },
  });

  const report = await service.sync();

  assert.equal(report.sources[0]?.errorCode, "translator_network_error");
  assert.equal(translationCalls, 2);
  assert.deepEqual(failedIds, ["item-1", "item-2"]);
});
