-- Per-article view tally (조회수) + ranking index for the 인기 콘텐츠 page.
-- Run once in the Neon SQL Editor. Written idempotently so a re-run is safe.
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0 NOT NULL;
CREATE INDEX IF NOT EXISTS "articles_status_view_count_idx" ON "articles" USING btree ("status","view_count" DESC NULLS LAST);
