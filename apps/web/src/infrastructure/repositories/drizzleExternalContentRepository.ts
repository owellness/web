import { randomUUID } from "node:crypto";

import {
  and,
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

  async applyTranslationPolicy(source, allowed, provider) {
    const now = new Date();
    const rows = await db
      .update(externalContentItems)
      .set({
        status: allowed ? "pending_translation" : "rights_pending",
        translatedTitle: null,
        translatedExcerpt: null,
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

    const needsTranslation =
      source.translationAllowed &&
      (!existing ||
        existing.contentHash !== item.contentHash ||
        existing.status !== "published");

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
    const permissionsChanged =
      !source.translationAllowed && existing.status === "published";

    await db
      .update(externalContentItems)
      .set({
        sourceName: source.name,
        sourceUrl: item.sourceUrl,
        sourceAuthor: item.sourceAuthor,
        sourcePublishedAt: item.sourcePublishedAt,
        originalTitle: item.originalTitle,
        originalExcerpt: item.originalExcerpt,
        contentHash: item.contentHash,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
        ...(contentChanged || permissionsChanged || needsTranslation
          ? {
              status: desiredStatus,
              translatedTitle: null,
              translatedExcerpt: null,
              translationProvider: null,
              translationError: null,
              translatedAt: null,
            }
          : {}),
      })
      .where(eq(externalContentItems.id, existing.id));

    return {
      changed: contentChanged || permissionsChanged,
      visibilityChanged:
        existing.status === "published" &&
        (contentChanged || permissionsChanged),
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
        sourceAuthor: externalContentItems.sourceAuthor,
        sourcePublishedAt: externalContentItems.sourcePublishedAt,
        contentHash: externalContentItems.contentHash,
      })
      .from(externalContentItems)
      .where(
        and(
          eq(externalContentItems.sourceKey, source),
          inArray(externalContentItems.status, [
            "pending_translation",
            "failed",
          ]),
        ),
      )
      .orderBy(desc(externalContentItems.sourcePublishedAt))
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
            inArray(externalContentItems.status, [
              "pending_translation",
              "failed",
            ]),
          ),
        )
        .returning({ id: externalContentItems.id });
      published += rows.length;
    }
    return published;
  },

  async markTranslationFailed(candidates, errorCode: string) {
    for (const candidate of candidates) {
      await db
        .update(externalContentItems)
        .set({
          status: "failed",
          translationError: errorCode.slice(0, 120),
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
};
