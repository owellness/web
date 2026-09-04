import { randomUUID } from "node:crypto";

import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  lt,
  ne,
  notInArray,
  or,
  sql,
} from "drizzle-orm";

import type {
  ExternalContentDetail,
  ExternalContentSummary,
  ExternalFeedItem,
  ExternalFeedSource,
  ExternalTranslation,
  StageResult,
} from "@/application/externalContent/model";
import type { ExternalContentRepositoryPort } from "@/application/externalContent/ports";

import { db } from "@/infrastructure/db/client";
import {
  externalContentItems,
  externalFeedStates,
} from "@/infrastructure/db/schema";

const stageStatus = (source: ExternalFeedSource) =>
  source.translationAllowed ? "pending_translation" : "rights_pending";

export const drizzleExternalContentRepository: ExternalContentRepositoryPort = {
  async tryAcquireSourceLease(source) {
    const leaseToken = randomUUID();

    await db
      .insert(externalFeedStates)
      .values({ sourceKey: source })
      .onConflictDoNothing();

    const [claimed] = await db
      .update(externalFeedStates)
      .set({
        leaseToken,
        leaseExpiresAt: sql`now() + interval '120 seconds'`,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(externalFeedStates.sourceKey, source),
          or(
            isNull(externalFeedStates.leaseExpiresAt),
            lt(externalFeedStates.leaseExpiresAt, sql`now()`),
          ),
        ),
      )
      .returning({ leaseToken: externalFeedStates.leaseToken });

    return claimed?.leaseToken ?? null;
  },

  async releaseSourceLease(source, leaseToken) {
    await db
      .update(externalFeedStates)
      .set({
        leaseToken: null,
        leaseExpiresAt: null,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(externalFeedStates.sourceKey, source),
          eq(externalFeedStates.leaseToken, leaseToken),
        ),
      );
  },

  async getFeedState(source) {
    const [row] = await db
      .select({
        etag: externalFeedStates.etag,
        lastModified: externalFeedStates.lastModified,
      })
      .from(externalFeedStates)
      .where(eq(externalFeedStates.sourceKey, source))
      .limit(1);
    return row ?? null;
  },

  async hasPendingBodyRefresh(source) {
    const [row] = await db
      .select({ id: externalContentItems.id })
      .from(externalContentItems)
      .where(
        and(
          eq(externalContentItems.sourceKey, source),
          eq(externalContentItems.status, "pending_translation"),
          eq(externalContentItems.originalBody, ""),
        ),
      )
      .limit(1);

    return Boolean(row);
  },

  async applyTranslationPolicy(source, allowed, provider) {
    const now = new Date();
    const rows = await db
      .update(externalContentItems)
      .set({
        status: allowed ? "pending_translation" : "rights_pending",
        ...(!allowed ? { originalBody: "" } : {}),
        translatedTitle: null,
        translatedExcerpt: null,
        translatedBody: null,
        translationProvider: null,
        translationError: null,
        translatedAt: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(externalContentItems.sourceKey, source),
          allowed
            ? or(
                eq(externalContentItems.status, "rights_pending"),
                and(
                  eq(externalContentItems.status, "published"),
                  or(
                    isNull(externalContentItems.translationProvider),
                    ne(externalContentItems.translationProvider, provider),
                  ),
                ),
              )
            : notInArray(externalContentItems.status, [
                "rights_pending",
                "withdrawn",
              ]),
        ),
      )
      .returning({ id: externalContentItems.id });

    return rows.length;
  },

  async stageItem(
    source: ExternalFeedSource,
    item: ExternalFeedItem,
  ): Promise<StageResult> {
    const [existing] = await db
      .select({
        id: externalContentItems.id,
        contentHash: externalContentItems.contentHash,
        status: externalContentItems.status,
        originalTitle: externalContentItems.originalTitle,
        originalExcerpt: externalContentItems.originalExcerpt,
        originalBody: externalContentItems.originalBody,
        translatedBody: externalContentItems.translatedBody,
      })
      .from(externalContentItems)
      .where(
        or(
          and(
            eq(externalContentItems.sourceKey, source.key),
            eq(externalContentItems.externalId, item.externalId),
          ),
          eq(externalContentItems.sourceUrl, item.sourceUrl),
        ),
      )
      .limit(1);

    const desiredStatus = stageStatus(source);
    if (existing?.status === "withdrawn") {
      await db
        .update(externalContentItems)
        .set({ lastSeenAt: new Date(), updatedAt: new Date() })
        .where(eq(externalContentItems.id, existing.id));
      return { changed: false, visibilityChanged: false };
    }

    if (!existing) {
      const [inserted] = await db
        .insert(externalContentItems)
        .values({
          sourceKey: source.key,
          sourceName: source.name,
          externalId: item.externalId,
          sourceUrl: item.sourceUrl,
          sourceAuthor: item.sourceAuthor,
          sourcePublishedAt: item.sourcePublishedAt,
          originalTitle: item.originalTitle,
          originalExcerpt: item.originalExcerpt,
          originalBody: item.originalBody,
          contentHash: item.contentHash,
          status: desiredStatus,
        })
        .onConflictDoNothing()
        .returning({ id: externalContentItems.id });

      return {
        changed: Boolean(inserted),
        visibilityChanged: false,
      };
    }

    const contentChanged = existing.contentHash !== item.contentHash;
    const summaryChanged =
      existing.originalTitle !== item.originalTitle ||
      existing.originalExcerpt !== item.originalExcerpt;
    const bodyChanged = existing.originalBody !== item.originalBody;
    const bodyTranslationMissing = Boolean(
      item.originalBody && !existing.translatedBody,
    );
    const permissionsChanged =
      !source.translationAllowed && existing.status === "published";
    const needsFullTranslation =
      source.translationAllowed &&
      (summaryChanged ||
        (existing.status !== "published" && contentChanged));
    const needsBodyTranslation =
      source.translationAllowed &&
      existing.status === "published" &&
      !summaryChanged &&
      (bodyChanged || bodyTranslationMissing);

    await db
      .update(externalContentItems)
      .set({
        sourceName: source.name,
        sourceUrl: item.sourceUrl,
        sourceAuthor: item.sourceAuthor,
        sourcePublishedAt: item.sourcePublishedAt,
        originalTitle: item.originalTitle,
        originalExcerpt: item.originalExcerpt,
        originalBody: item.originalBody,
        contentHash: item.contentHash,
        lastSeenAt: new Date(),
        ...(contentChanged || permissionsChanged
          ? { updatedAt: new Date() }
          : {}),
        ...(permissionsChanged || needsFullTranslation
          ? {
              status: desiredStatus,
              translatedTitle: null,
              translatedExcerpt: null,
              translatedBody: null,
              translationProvider: null,
              translationError: null,
              translatedAt: null,
            }
          : needsBodyTranslation && bodyChanged
            ? {
                translatedBody: null,
                translationError: null,
              }
            : {}),
      })
      .where(eq(externalContentItems.id, existing.id));

    return {
      changed: contentChanged || permissionsChanged,
      visibilityChanged:
        existing.status === "published" &&
        (permissionsChanged || needsFullTranslation),
    };
  },

  async listTranslationCandidates(source, limit) {
    const rows = await db
      .select({
        id: externalContentItems.id,
        sourceKey: externalContentItems.sourceKey,
        externalId: externalContentItems.externalId,
        sourceUrl: externalContentItems.sourceUrl,
        originalTitle: externalContentItems.originalTitle,
        originalExcerpt: externalContentItems.originalExcerpt,
        originalBody: externalContentItems.originalBody,
        sourceAuthor: externalContentItems.sourceAuthor,
        sourcePublishedAt: externalContentItems.sourcePublishedAt,
        contentHash: externalContentItems.contentHash,
      })
      .from(externalContentItems)
      .where(
        and(
          eq(externalContentItems.sourceKey, source),
          or(
            inArray(externalContentItems.status, [
              "pending_translation",
              "failed",
            ]),
            and(
              eq(externalContentItems.status, "published"),
              ne(externalContentItems.originalBody, ""),
              isNull(externalContentItems.translatedBody),
            ),
          ),
        ),
      )
      .orderBy(
        sql`CASE
          WHEN ${externalContentItems.status} = 'pending_translation' THEN 0
          WHEN ${externalContentItems.status} = 'published'
            AND ${externalContentItems.translationError} IS NULL THEN 1
          ELSE 2
        END`,
        asc(externalContentItems.updatedAt),
        desc(externalContentItems.sourcePublishedAt),
      )
      .limit(limit);

    return rows.map((row) => ({ ...row, sourceKey: source }));
  },

  async publishTranslations(translations: ExternalTranslation[]) {
    let published = 0;
    for (const translation of translations) {
      const rows = await db
        .update(externalContentItems)
        .set({
          translatedTitle: translation.translatedTitle,
          translatedExcerpt: translation.translatedExcerpt,
          translatedBody: translation.translatedBody,
          translationProvider: translation.provider,
          translationError: null,
          translatedAt: new Date(),
          updatedAt: new Date(),
          status: "published",
        })
        .where(
          and(
            eq(externalContentItems.id, translation.id),
            eq(externalContentItems.contentHash, translation.contentHash),
            or(
              inArray(externalContentItems.status, [
                "pending_translation",
                "failed",
              ]),
              and(
                eq(externalContentItems.status, "published"),
                eq(externalContentItems.translationProvider, translation.provider),
                isNull(externalContentItems.translatedBody),
              ),
            ),
          ),
        )
        .returning({ id: externalContentItems.id });
      published += rows.length;
    }
    return published;
  },

  async markTranslationFailed(candidates, errorCode: string) {
    for (const candidate of candidates) {
      const failure = errorCode.slice(0, 120);
      await db
        .update(externalContentItems)
        .set({
          status: "failed",
          translationError: failure,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(externalContentItems.id, candidate.id),
            eq(externalContentItems.contentHash, candidate.contentHash),
            inArray(externalContentItems.status, [
              "pending_translation",
              "failed",
            ]),
          ),
        );

      await db
        .update(externalContentItems)
        .set({
          translationError: failure,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(externalContentItems.id, candidate.id),
            eq(externalContentItems.contentHash, candidate.contentHash),
            eq(externalContentItems.status, "published"),
            isNull(externalContentItems.translatedBody),
          ),
        );
    }
  },

  async markFeedSuccess(source, etag, lastModified) {
    const now = new Date();
    await db
      .insert(externalFeedStates)
      .values({
        sourceKey: source,
        etag,
        lastModified,
        lastAttemptAt: now,
        lastSuccessAt: now,
        lastError: null,
        consecutiveFailures: 0,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: externalFeedStates.sourceKey,
        set: {
          etag,
          lastModified,
          lastAttemptAt: now,
          lastSuccessAt: now,
          lastError: null,
          consecutiveFailures: 0,
          updatedAt: now,
        },
      });
  },

  async markFeedFailure(source, errorCode) {
    const now = new Date();
    await db
      .insert(externalFeedStates)
      .values({
        sourceKey: source,
        lastAttemptAt: now,
        lastError: errorCode.slice(0, 120),
        consecutiveFailures: 1,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: externalFeedStates.sourceKey,
        set: {
          lastAttemptAt: now,
          lastError: errorCode.slice(0, 120),
          consecutiveFailures: sql`${externalFeedStates.consecutiveFailures} + 1`,
          updatedAt: now,
        },
      });
  },

  async listPublished(
    limit,
    allowedSources,
    provider,
  ): Promise<ExternalContentSummary[]> {
    const groups = await Promise.all(
      allowedSources.map(async (source) => {
        const rows = await db
          .select({
            id: externalContentItems.id,
            sourceKey: externalContentItems.sourceKey,
            sourceName: externalContentItems.sourceName,
            sourceUrl: externalContentItems.sourceUrl,
            sourceAuthor: externalContentItems.sourceAuthor,
            sourcePublishedAt: externalContentItems.sourcePublishedAt,
            title: externalContentItems.translatedTitle,
            excerpt: externalContentItems.translatedExcerpt,
          })
          .from(externalContentItems)
          .where(
            and(
              eq(externalContentItems.status, "published"),
              eq(externalContentItems.sourceKey, source),
              eq(externalContentItems.translationProvider, provider),
            ),
          )
          .orderBy(desc(externalContentItems.sourcePublishedAt))
          .limit(limit);

        return rows
          .filter(
            (
              row,
            ): row is typeof row & {
              title: string;
              excerpt: string | null;
            } => Boolean(row.title),
          )
          .map((row) => ({
            ...row,
            sourceKey: source,
            title: row.title,
            excerpt: row.excerpt ?? "",
          }));
      }),
    );

    groups.sort(
      (left, right) =>
        (right[0]?.sourcePublishedAt.getTime() ?? 0) -
        (left[0]?.sourcePublishedAt.getTime() ?? 0),
    );

    const balanced: ExternalContentSummary[] = [];
    for (let position = 0; balanced.length < limit; position += 1) {
      let added = false;
      for (const group of groups) {
        const item = group[position];
        if (!item) continue;
        balanced.push(item);
        added = true;
        if (balanced.length === limit) break;
      }
      if (!added) break;
    }

    return balanced;
  },

  async findPublishedById(
    id,
    allowedSources,
    provider,
  ): Promise<ExternalContentDetail | null> {
    if (allowedSources.length === 0) return null;

    const [row] = await db
      .select({
        id: externalContentItems.id,
        sourceKey: externalContentItems.sourceKey,
        sourceName: externalContentItems.sourceName,
        sourceUrl: externalContentItems.sourceUrl,
        sourceAuthor: externalContentItems.sourceAuthor,
        sourcePublishedAt: externalContentItems.sourcePublishedAt,
        originalTitle: externalContentItems.originalTitle,
        title: externalContentItems.translatedTitle,
        excerpt: externalContentItems.translatedExcerpt,
        body: externalContentItems.translatedBody,
        translatedAt: externalContentItems.translatedAt,
      })
      .from(externalContentItems)
      .where(
        and(
          eq(externalContentItems.id, id),
          eq(externalContentItems.status, "published"),
          inArray(externalContentItems.sourceKey, allowedSources),
          eq(externalContentItems.translationProvider, provider),
        ),
      )
      .limit(1);

    if (!row?.title) return null;
    return {
      ...row,
      sourceKey: row.sourceKey as ExternalContentDetail["sourceKey"],
      title: row.title,
      excerpt: row.excerpt ?? "",
      body: row.body ?? "",
    };
  },
};
