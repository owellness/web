-- Numeric article slugs: a sequence used to auto-number slugs that the admin
-- leaves blank. Run once in the Neon SQL Editor.
CREATE SEQUENCE IF NOT EXISTS "article_slug_seq" START WITH 1 INCREMENT BY 1;
