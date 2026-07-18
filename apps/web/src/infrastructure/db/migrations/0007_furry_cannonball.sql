CREATE TABLE "owti_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"answers" jsonb NOT NULL,
	"domain_averages" jsonb NOT NULL,
	"type_code" varchar(4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "owti_results" ADD CONSTRAINT "owti_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "owti_results_user_created_idx" ON "owti_results" USING btree ("user_id","created_at" DESC NULLS LAST);