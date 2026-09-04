import type {
  ExternalContentDetail,
  ExternalContentSummary,
  ExternalFeedItem,
  ExternalFeedResult,
  ExternalFeedSource,
  ExternalFeedState,
  ExternalSourceKey,
  ExternalTranslation,
  StageResult,
  TranslationCandidate,
} from "./model";

export interface ExternalFeedReaderPort {
  fetch(
    source: ExternalFeedSource,
    state: ExternalFeedState | null,
  ): Promise<ExternalFeedResult>;
}

export interface ExternalTranslatorPort {
  readonly provider: string;
  isConfigured(): boolean;
  translate(
    candidates: TranslationCandidate[],
    options?: { signal?: AbortSignal },
  ): Promise<ExternalTranslation[]>;
}

export interface ExternalContentRepositoryPort {
  tryAcquireSourceLease(source: ExternalSourceKey): Promise<string | null>;
  releaseSourceLease(
    source: ExternalSourceKey,
    leaseToken: string,
  ): Promise<void>;
  getFeedState(source: ExternalSourceKey): Promise<ExternalFeedState | null>;
  hasPendingBodyRefresh(source: ExternalSourceKey): Promise<boolean>;
  applyTranslationPolicy(
    source: ExternalSourceKey,
    allowed: boolean,
    provider: string,
  ): Promise<number>;
  stageItem(
    source: ExternalFeedSource,
    item: ExternalFeedItem,
  ): Promise<StageResult>;
  listTranslationCandidates(
    source: ExternalSourceKey,
    limit: number,
  ): Promise<TranslationCandidate[]>;
  publishTranslations(translations: ExternalTranslation[]): Promise<number>;
  markTranslationFailed(
    candidates: TranslationCandidate[],
    errorCode: string,
  ): Promise<void>;
  markFeedSuccess(
    source: ExternalSourceKey,
    etag: string | null,
    lastModified: string | null,
  ): Promise<void>;
  markFeedFailure(source: ExternalSourceKey, errorCode: string): Promise<void>;
  listPublished(
    limit: number,
    allowedSources: ExternalSourceKey[],
    provider: string,
  ): Promise<ExternalContentSummary[]>;
  findPublishedById(
    id: string,
    allowedSources: ExternalSourceKey[],
    provider: string,
  ): Promise<ExternalContentDetail | null>;
}

export interface ExternalContentRevalidationPort {
  revalidateHome(): Promise<void>;
}
