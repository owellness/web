DO $$
BEGIN
	CREATE TYPE "public"."external_content_status" AS ENUM('rights_pending', 'pending_translation', 'published', 'failed');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_feed_states" (
	"source_key" varchar(40) PRIMARY KEY NOT NULL,
	"etag" text,
	"last_modified" text,
	"last_attempt_at" timestamp with time zone,
	"last_success_at" timestamp with time zone,
	"last_error" varchar(120),
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "external_content_source_external_uidx" ON "external_content_items" USING btree ("source_key","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "external_content_source_url_uidx" ON "external_content_items" USING btree ("source_url");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "external_content_status_published_idx" ON "external_content_items" USING btree ("status","source_published_at" DESC NULLS LAST);
