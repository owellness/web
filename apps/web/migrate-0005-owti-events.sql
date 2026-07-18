-- Migration 0005 — OWTI assessment funnel events (anonymous analytics).
-- Safe to run standalone; idempotent guards let it re-run without error.

DO $$ BEGIN
  CREATE TYPE "public"."owti_event_type" AS ENUM('start', 'advance', 'complete');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "owti_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(40) NOT NULL,
	"type" "owti_event_type" NOT NULL,
	"step" integer,
	"code" varchar(4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "owti_events_type_created_idx" ON "owti_events" USING btree ("type","created_at");
CREATE INDEX IF NOT EXISTS "owti_events_session_idx" ON "owti_events" USING btree ("session_id");
CREATE INDEX IF NOT EXISTS "owti_events_created_idx" ON "owti_events" USING btree ("created_at" DESC NULLS LAST);
