export const EXTERNAL_SOURCE_KEYS = [
  "nutritionfacts",
  "gowinglife",
  "gwi",
] as const;

export type ExternalSourceKey = (typeof EXTERNAL_SOURCE_KEYS)[number];

export type ExternalFeedSource = {
  key: ExternalSourceKey;
  name: string;
  homepageUrl: string;
  feedUrl: string;
  allowedHosts: readonly string[];
  translationAllowed: boolean;
};

export type ExternalFeedState = {
  etag: string | null;
  lastModified: string | null;
};

export type ExternalFeedItem = {
  externalId: string;
  sourceUrl: string;
  originalTitle: string;
  originalExcerpt: string;
  sourceAuthor: string | null;
  sourcePublishedAt: Date;
  contentHash: string;
};

export type ExternalFeedResult =
  | {
      kind: "not-modified";
      etag: string | null;
      lastModified: string | null;
    }
  | {
      kind: "items";
      etag: string | null;
      lastModified: string | null;
      items: ExternalFeedItem[];
    };

export type TranslationCandidate = ExternalFeedItem & {
  id: string;
  sourceKey: ExternalSourceKey;
};

export type ExternalTranslation = {
  id: string;
  contentHash: string;
  translatedTitle: string;
  translatedExcerpt: string;
  provider: string;
};

export type StageResult = {
  changed: boolean;
  visibilityChanged: boolean;
};

export type ExternalContentSummary = {
  id: string;
  sourceKey: ExternalSourceKey;
  sourceName: string;
  sourceUrl: string;
  sourceAuthor: string | null;
  sourcePublishedAt: Date;
  title: string;
  excerpt: string;
};

export type ExternalSourceSyncResult = {
  source: ExternalSourceKey;
  status: "ok" | "not-modified" | "skipped" | "failed";
  discovered: number;
  translated: number;
  rightsPending: number;
  visibilityChanged: boolean;
  errorCode?: string;
};

export type ExternalSyncReport = {
  startedAt: string;
  finishedAt: string;
  sources: ExternalSourceSyncResult[];
};
