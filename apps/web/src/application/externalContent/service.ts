import type {
  ExternalContentSummary,
  ExternalFeedSource,
  ExternalSourceSyncResult,
  ExternalSyncReport,
  TranslationCandidate,
} from "./model";
import type {
  ExternalContentRepositoryPort,
  ExternalContentRevalidationPort,
  ExternalFeedReaderPort,
  ExternalTranslatorPort,
} from "./ports";

type Dependencies = {
  sources: readonly ExternalFeedSource[];
  feedReader: ExternalFeedReaderPort;
  translator: ExternalTranslatorPort;
  repository: ExternalContentRepositoryPort;
  revalidation: ExternalContentRevalidationPort;
};

const errorCode = (error: unknown): string => {
  if (error instanceof Error && /^[a-z0-9_-]{1,80}$/i.test(error.message)) {
    return error.message.toLowerCase();
  }
  return "external_sync_failed";
};

export const createExternalContentService = ({
  sources,
  feedReader,
  translator,
  repository,
  revalidation,
}: Dependencies) => {
  const syncSource = async (
    source: ExternalFeedSource,
  ): Promise<ExternalSourceSyncResult> => {
    let rightsPending = 0;
    let changed = 0;
    let visibilityChanged = false;
    let leaseToken: string | null = null;

    try {
      leaseToken = await repository.tryAcquireSourceLease(source.key);
    } catch (error) {
      return {
        source: source.key,
        status: "failed",
        discovered: 0,
        translated: 0,
        rightsPending: 0,
        visibilityChanged: false,
        errorCode: errorCode(error),
      };
    }

    if (!leaseToken) {
      return {
        source: source.key,
        status: "skipped",
        discovered: 0,
        translated: 0,
        rightsPending: 0,
        visibilityChanged: false,
        errorCode: "sync_in_progress",
      };
    }

    try {
      const policyChanged = await repository.applyTranslationPolicy(
        source.key,
        source.translationAllowed,
        translator.provider,
      );
      if (!source.translationAllowed) rightsPending += policyChanged;
      else if (policyChanged > 0) visibilityChanged = true;

      const state = await repository.getFeedState(source.key);
      const feed = await feedReader.fetch(source, state);

      if (feed.kind === "items") {
        for (const item of feed.items) {
          const staged = await repository.stageItem(source, item);
          if (staged.changed) changed += 1;
          if (staged.visibilityChanged) visibilityChanged = true;
          if (staged.changed && !source.translationAllowed) rightsPending += 1;
        }
      }

      await repository.markFeedSuccess(
        source.key,
        feed.etag ?? state?.etag ?? null,
        feed.lastModified ?? state?.lastModified ?? null,
      );

      const candidates: TranslationCandidate[] = source.translationAllowed
        ? await repository.listTranslationCandidates(source.key, 20)
        : [];
      const translatorConfigured = translator.isConfigured();

      let translated = 0;
      if (candidates.length > 0 && translatorConfigured) {
        try {
          const translations = await translator.translate(candidates);
          translated = await repository.publishTranslations(translations);
        } catch (error) {
          const code = errorCode(error);
          await repository.markTranslationFailed(candidates, code);
          return {
            source: source.key,
            status: "failed",
            discovered: changed,
            translated: 0,
            rightsPending,
            visibilityChanged,
            errorCode: code,
          };
        }
      }

      if (candidates.length > 0 && !translatorConfigured) {
        return {
          source: source.key,
          status: "failed",
          discovered: changed,
          translated: 0,
          rightsPending,
          visibilityChanged,
          errorCode: "translator_not_configured",
        };
      }

      return {
        source: source.key,
        status: feed.kind === "not-modified" ? "not-modified" : "ok",
        discovered: changed,
        translated,
        rightsPending,
        visibilityChanged,
      };
    } catch (error) {
      const code = errorCode(error);
      await repository.markFeedFailure(source.key, code).catch(() => undefined);
      return {
        source: source.key,
        status: "failed",
        discovered: changed,
        translated: 0,
        rightsPending,
        visibilityChanged,
        errorCode: code,
      };
    } finally {
      await repository
        .releaseSourceLease(source.key, leaseToken)
        .catch(() => undefined);
    }
  };

  return {
    async sync(): Promise<ExternalSyncReport> {
      const startedAt = new Date().toISOString();
      const results = await Promise.all(sources.map(syncSource));

      if (
        results.some(
          (result) =>
            result.translated > 0 ||
            result.rightsPending > 0 ||
            result.visibilityChanged,
        )
      ) {
        await revalidation.revalidateHome();
      }

      return {
        startedAt,
        finishedAt: new Date().toISOString(),
        sources: results,
      };
    },

    async listPublished(limit = 6): Promise<ExternalContentSummary[]> {
      const safeLimit = Math.min(24, Math.max(1, Math.floor(limit)));
      const allowedSources = sources
        .filter((source) => source.translationAllowed)
        .map((source) => source.key);
      if (allowedSources.length === 0) return [];
      return repository.listPublished(
        safeLimit,
        allowedSources,
        translator.provider,
      );
    },
  };
};
