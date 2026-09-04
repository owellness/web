-- Idempotent companion for translated external wellness briefing ingestion.
-- Run this file as a single query in the Neon SQL Editor.
BEGIN;
SET LOCAL search_path = public, pg_catalog;

DO $$
BEGIN
  CREATE TYPE "external_content_status" AS ENUM (
    'rights_pending',
    'pending_translation',
    'published',
    'failed',
    'withdrawn'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "external_content_status" ADD VALUE IF NOT EXISTS 'withdrawn';

CREATE TABLE IF NOT EXISTS "external_content_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source_key" varchar(40) NOT NULL,
  "source_name" varchar(120) NOT NULL,
  "external_id" varchar(500) NOT NULL,
  "source_url" text NOT NULL,
  "source_author" varchar(200),
  "source_published_at" timestamp with time zone NOT NULL,
  "original_title" text NOT NULL,
  "original_excerpt" text DEFAULT '' NOT NULL,
  "translated_title" text,
  "translated_excerpt" text,
  "content_hash" varchar(64) NOT NULL,
  "status" "external_content_status" DEFAULT 'rights_pending' NOT NULL,
  "translation_provider" varchar(40),
  "translation_error" varchar(120),
  "translated_at" timestamp with time zone,
  "first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "external_feed_states" (
  "source_key" varchar(40) PRIMARY KEY NOT NULL,
  "etag" text,
  "last_modified" text,
  "last_attempt_at" timestamp with time zone,
  "last_success_at" timestamp with time zone,
  "last_error" varchar(120),
  "consecutive_failures" integer DEFAULT 0 NOT NULL,
  "lease_token" varchar(36),
  "lease_expires_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "external_feed_states"
  ADD COLUMN IF NOT EXISTS "lease_token" varchar(36);
ALTER TABLE "external_feed_states"
  ADD COLUMN IF NOT EXISTS "lease_expires_at" timestamp with time zone;

CREATE UNIQUE INDEX IF NOT EXISTS "external_content_source_external_uidx"
  ON "external_content_items" ("source_key", "external_id");
CREATE UNIQUE INDEX IF NOT EXISTS "external_content_source_url_uidx"
  ON "external_content_items" ("source_url");
CREATE INDEX IF NOT EXISTS "external_content_status_published_idx"
  ON "external_content_items" ("status", "source_published_at" DESC NULLS LAST);

COMMIT;
