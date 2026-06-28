CREATE TYPE "public"."article_status" AS ENUM('draft', 'published', 'archived');
CREATE TYPE "public"."subscriber_status" AS ENUM('pending', 'confirmed', 'unsubscribed');
CREATE TYPE "public"."user_role" AS ENUM('admin', 'author', 'viewer');
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);

CREATE TABLE "article_tags" (
	"article_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "article_tags_article_id_tag_id_pk" PRIMARY KEY("article_id","tag_id")
);

CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(200) NOT NULL,
	"excerpt" varchar(300) NOT NULL,
	"tldr" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content_json" jsonb NOT NULL,
	"content_html" text NOT NULL,
	"status" "article_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"author_id" uuid NOT NULL,
	"primary_category_id" uuid NOT NULL,
	"medical_reviewer_id" uuid,
	"og_image_url" text,
	"seo_title" varchar(200),
	"seo_description" varchar(300),
	"canonical_url" text,
	"reading_time_sec" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);

CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slug" varchar(80) NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"avatar_url" text,
	"credentials" text,
	"affiliation" text,
	"website_url" text,
	"social_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "authors_slug_unique" UNIQUE("slug")
);

CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"seo_title" varchar(200),
	"seo_description" varchar(300),
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);

CREATE TABLE "faq_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid,
	"category_id" uuid,
	"question" varchar(240) NOT NULL,
	"answer_html" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "howto_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"primary_category_id" uuid,
	"author_id" uuid,
	"estimated_minutes" integer,
	"tools_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "howto_items_slug_unique" UNIQUE("slug")
);

CREATE TABLE "howto_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"howto_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"body_html" text NOT NULL,
	"image_url" text
);

CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"pathname" text NOT NULL,
	"content_type" varchar(80) NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"alt" text,
	"uploaded_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(254) NOT NULL,
	"status" "subscriber_status" DEFAULT 'pending' NOT NULL,
	"source" varchar(60),
	"consented_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);

CREATE TABLE "site_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"title" varchar(200) NOT NULL,
	"body_html" text DEFAULT '' NOT NULL,
	"body_json" jsonb NOT NULL,
	"seo_title" varchar(200),
	"seo_description" varchar(300),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_pages_slug_unique" UNIQUE("slug")
);

CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);

CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "articles" ADD CONSTRAINT "articles_primary_category_id_categories_id_fk" FOREIGN KEY ("primary_category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "articles" ADD CONSTRAINT "articles_medical_reviewer_id_authors_id_fk" FOREIGN KEY ("medical_reviewer_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "authors" ADD CONSTRAINT "authors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "howto_items" ADD CONSTRAINT "howto_items_primary_category_id_categories_id_fk" FOREIGN KEY ("primary_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "howto_items" ADD CONSTRAINT "howto_items_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "howto_steps" ADD CONSTRAINT "howto_steps_howto_id_howto_items_id_fk" FOREIGN KEY ("howto_id") REFERENCES "public"."howto_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "article_tags_tag_idx" ON "article_tags" USING btree ("tag_id");
CREATE INDEX "articles_status_published_at_idx" ON "articles" USING btree ("status","published_at" DESC NULLS LAST);
CREATE INDEX "articles_primary_category_idx" ON "articles" USING btree ("primary_category_id","published_at" DESC NULLS LAST);
CREATE INDEX "articles_author_idx" ON "articles" USING btree ("author_id","published_at" DESC NULLS LAST);
CREATE INDEX "articles_status_view_count_idx" ON "articles" USING btree ("status","view_count" DESC NULLS LAST);
CREATE UNIQUE INDEX "authors_user_id_uidx" ON "authors" USING btree ("user_id");
CREATE INDEX "faq_items_article_idx" ON "faq_items" USING btree ("article_id","position");
CREATE INDEX "faq_items_category_idx" ON "faq_items" USING btree ("category_id","position");
CREATE UNIQUE INDEX "howto_steps_howto_position_uidx" ON "howto_steps" USING btree ("howto_id","position");
CREATE INDEX "newsletter_subscribers_status_idx" ON "newsletter_subscribers" USING btree ("status");

-- ─────────────────────────────────────────────
-- Newsletter campaigns (broadcast history) — migration 0001
-- ─────────────────────────────────────────────
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'sending', 'sent', 'failed');
CREATE TABLE IF NOT EXISTS "newsletter_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" varchar(200) NOT NULL,
	"content_json" jsonb NOT NULL,
	"content_html" text NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"error" text,
	"sent_at" timestamp with time zone,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "newsletter_campaigns" ADD CONSTRAINT "newsletter_campaigns_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "newsletter_campaigns_created_at_idx" ON "newsletter_campaigns" USING btree ("created_at" DESC NULLS LAST);

-- ─────────────────────────────────────────────
-- Numeric article slug sequence — migration 0002
-- ─────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS "article_slug_seq" START WITH 1 INCREMENT BY 1;

-- ─────────────────────────────────────────────
-- Site settings (single-row) — migration 0003
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "site_settings" (
	"id" varchar(20) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"hero_eyebrow" varchar(120) DEFAULT '' NOT NULL,
	"hero_title" text DEFAULT '' NOT NULL,
	"hero_subtitle" text DEFAULT '' NOT NULL,
	"favicon_url" text,
	"og_image_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
-- Admin-uploadable default OG image — migration 0006. ADD COLUMN IF NOT EXISTS
-- upgrades databases provisioned before the column existed (the CREATE TABLE
-- above is a no-op once the table is present).
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "og_image_url" text;

-- ─────────────────────────────────────────────
-- OWTI assessment funnel events — migration 0005
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- Seed: 카테고리 4개 (앱이 자동 시드하지만 사전 삽입해 둠)
-- ─────────────────────────────────────────────
INSERT INTO "categories" ("slug", "name", "description", "position") VALUES
  ('sleep', '수면 · 스트레스 · 정신건강', '수면의 질을 높이고 스트레스를 다스리는 과학 기반 가이드. 수면 위생, 번아웃 회복, 명상까지.', 0),
  ('nutrition', '영양 · 다이어트 · 식이요법', '지속 가능한 식습관과 영양제 가이드. 단식, 케토, 지중해식, 한국형 식단을 근거 기반으로 정리합니다.', 1),
  ('fitness', '운동 · 홈트 · 근력', '초보부터 중급까지 활용할 수 있는 홈트, 근력, 유산소 루틴과 자세 교정 콘텐츠.', 2),
  ('women', '여성 · 호르몬 · 갱년기', '여성 라이프스테이지별 건강 관리: 생리주기, PMS, 임신·출산, 갱년기, 호르몬 균형을 정리한 가이드.', 3)
ON CONFLICT ("slug") DO NOTHING;
