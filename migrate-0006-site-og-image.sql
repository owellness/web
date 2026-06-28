-- Migration 0006 — admin-uploadable default Open Graph (social share) image.
-- Adds site_settings.og_image_url, used as the site-wide default OG image when
-- set (overriding the bundled SITE_CONFIG.defaultOgImage). Run once in the Neon
-- SQL Editor. Written idempotently so a re-run is safe.
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "og_image_url" text;
