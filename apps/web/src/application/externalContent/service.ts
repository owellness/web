import type {
  ExternalContentDetail,
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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TRANSLATION_CANDIDATES_PER_SOURCE = 4;
const SOURCE_SYNC_BUDGET_MS = 45_000;
const SYSTEMIC_TRANSLATION_ERRORS = new Set([
  "translator_auth_failed",
  "translator_invalid_credentials",
  "translator_network_error",
  "translator_not_configured",
  "translator_quota_exceeded",
  "translator_timeout",
  "translator_upstream_unavailable",
]);

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
    const syncSignal = AbortSignal.timeout(SOURCE_SYNC_BUDGET_MS);
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
      const forceBodyRefresh =
        source.translationAllowed &&
        (await repository.hasPendingBodyRefresh(source.key));
      const feed = await feedReader.fetch(
        source,
        forceBodyRefresh ? null : state,
      );

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
        ? await repository.listTranslationCandidates(
            source.key,
            MAX_TRANSLATION_CANDIDATES_PER_SOURCE,
          )
        : [];
      const translatorConfigured = translator.isConfigured();

      let translated = 0;
      let translationFailure: string | undefined;
      if (candidates.length > 0 && translatorConfigured) {
        for (const candidate of candidates) {
          if (syncSignal.aborted) {
            translationFailure ??= "translator_timeout";
            break;
          }
          try {
            const translations = await translator.translate([candidate], {
              signal: syncSignal,
            });
            translated += await repository.publishTranslations(translations);
          } catch (error) {
            const code = errorCode(error);
            if (SYSTEMIC_TRANSLATION_ERRORS.has(code)) {
              translationFailure = code;
            } else {
              translationFailure ??= code;
            }
            await repository.markTranslationFailed([candidate], code);
            if (SYSTEMIC_TRANSLATION_ERRORS.has(code)) break;
          }
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

      if (translationFailure) {
        return {
          source: source.key,
          status: "failed",
          discovered: changed,
          translated,
          rightsPending,
          visibilityChanged,
          errorCode: translationFailure,
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

    async getPublishedById(id: string): Promise<ExternalContentDetail | null> {
      if (!UUID_PATTERN.test(id)) return null;
      const allowedSources = sources
        .filter((source) => source.translationAllowed)
        .map((source) => source.key);
      if (allowedSources.length === 0) return null;
      return repository.findPublishedById(
        id,
        allowedSources,
        translator.provider,
      );
    },
  };
};
