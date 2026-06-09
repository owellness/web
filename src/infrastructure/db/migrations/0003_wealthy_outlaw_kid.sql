CREATE TABLE "site_settings" (
	"id" varchar(20) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"hero_eyebrow" varchar(120) DEFAULT '' NOT NULL,
	"hero_title" text DEFAULT '' NOT NULL,
	"hero_subtitle" text DEFAULT '' NOT NULL,
	"favicon_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
