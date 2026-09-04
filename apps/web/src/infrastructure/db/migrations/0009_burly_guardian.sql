ALTER TABLE "external_feed_states" ADD COLUMN IF NOT EXISTS "lease_token" varchar(36);--> statement-breakpoint
ALTER TABLE "external_feed_states" ADD COLUMN IF NOT EXISTS "lease_expires_at" timestamp with time zone;
