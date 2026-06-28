CREATE TYPE "public"."owti_event_type" AS ENUM('start', 'advance', 'complete');--> statement-breakpoint
CREATE TABLE "owti_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(40) NOT NULL,
	"type" "owti_event_type" NOT NULL,
	"step" integer,
	"code" varchar(4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "owti_events_type_created_idx" ON "owti_events" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "owti_events_session_idx" ON "owti_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "owti_events_created_idx" ON "owti_events" USING btree ("created_at" DESC NULLS LAST);