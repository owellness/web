-- Idempotent companion for RSS body translation support.
-- Run this file as a single query in the Neon SQL Editor.
BEGIN;
SET LOCAL search_path = public, pg_catalog;

ALTER TABLE "external_content_items"
  ADD COLUMN IF NOT EXISTS "original_body" text DEFAULT '' NOT NULL;
ALTER TABLE "external_content_items"
  ADD COLUMN IF NOT EXISTS "translated_body" text;

COMMIT;
