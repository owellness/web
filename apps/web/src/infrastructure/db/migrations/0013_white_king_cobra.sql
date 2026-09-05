ALTER TABLE "external_content_items" ADD COLUMN "summary_lines" jsonb;--> statement-breakpoint
ALTER TABLE "external_content_items" ADD COLUMN "summary_provider" varchar(40);--> statement-breakpoint
ALTER TABLE "external_content_items" ADD COLUMN "summary_model" varchar(80);--> statement-breakpoint
ALTER TABLE "external_content_items" ADD COLUMN "summary_prompt_version" varchar(40);--> statement-breakpoint
ALTER TABLE "external_content_items" ADD COLUMN "summary_error" varchar(120);--> statement-breakpoint
ALTER TABLE "external_content_items" ADD COLUMN "summarized_at" timestamp with time zone;