ALTER TABLE "external_content_items" ADD COLUMN "original_body" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "external_content_items" ADD COLUMN "translated_body" text;
