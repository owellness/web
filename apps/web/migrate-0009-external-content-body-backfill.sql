-- Run only after the body-aware application deployment is Ready.
-- This forces one unconditional RSS fetch so existing summaries can be
-- backfilled without exposing the rollout to an old application version.
BEGIN;
SET LOCAL search_path = public, pg_catalog;

UPDATE "external_feed_states"
SET "etag" = NULL, "last_modified" = NULL, "updated_at" = now();

COMMIT;
