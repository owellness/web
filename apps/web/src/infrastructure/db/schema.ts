import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
import type { Gender } from "@owellness/shared/api/v1";

const idDefault = () => sql`gen_random_uuid()`;
const now = () => sql`now()`;

// ─────────────────────────────────────────────────────────────
// Auth.js (Drizzle adapter) — users / accounts / sessions / tokens
// ─────────────────────────────────────────────────────────────

export const userRole = pgEnum("user_role", ["admin", "author", "viewer"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(idDefault()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true, mode: "date" }),
  image: text("image"),
  role: userRole("role").notNull().default("viewer"),
  gender: varchar("gender", { length: 24 }).$type<Gender>(),
  birthDate: date("birth_date", { mode: "string" }),
  phone: varchar("phone", { length: 20 }),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
}, (t) => [uniqueIndex("users_phone_uidx").on(t.phone)]);

// NOTE: JS property names must stay snake_case here to satisfy the type
// constraint enforced by @auth/drizzle-adapter (DefaultPostgresAccountsTable).
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ─────────────────────────────────────────────────────────────
// Domain: authors (E-E-A-T)
// ─────────────────────────────────────────────────────────────

export const authors = pgTable(
  "authors",
  {
    id: uuid("id").primaryKey().default(idDefault()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 80 }).notNull().unique(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    bio: text("bio").notNull().default(""),
    avatarUrl: text("avatar_url"),
    credentials: text("credentials"),
    affiliation: text("affiliation"),
    websiteUrl: text("website_url"),
    socialJson: jsonb("social_json").$type<Record<string, string>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
  },
  (t) => [uniqueIndex("authors_user_id_uidx").on(t.userId)],
);

// ─────────────────────────────────────────────────────────────
// Domain: categories & tags
// ─────────────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().default(idDefault()),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description").notNull().default(""),
  seoTitle: varchar("seo_title", { length: 200 }),
  seoDescription: varchar("seo_description", { length: 300 }),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().default(idDefault()),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
});

// ─────────────────────────────────────────────────────────────
// Domain: articles + tags m2m
// ─────────────────────────────────────────────────────────────

export const articleStatus = pgEnum("article_status", [
  "draft",
  "published",
  "archived",
]);

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().default(idDefault()),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    excerpt: varchar("excerpt", { length: 300 }).notNull(),
    tldr: jsonb("tldr").$type<string[]>().default([]).notNull(),
    contentJson: jsonb("content_json").$type<unknown>().notNull(),
    contentHtml: text("content_html").notNull(),
    status: articleStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
    authorId: uuid("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "restrict" }),
    primaryCategoryId: uuid("primary_category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    medicalReviewerId: uuid("medical_reviewer_id").references(() => authors.id, {
      onDelete: "set null",
    }),
    ogImageUrl: text("og_image_url"),
    seoTitle: varchar("seo_title", { length: 200 }),
    seoDescription: varchar("seo_description", { length: 300 }),
    canonicalUrl: text("canonical_url"),
    readingTimeSec: integer("reading_time_sec").notNull().default(0),
    // Running tally of page views, incremented on each published-article visit
    // via POST /api/articles/[slug]/view. Powers the "인기 콘텐츠" ranking.
    viewCount: integer("view_count").notNull().default(0),
    // Postgres tsvector populated by trigger or generated column at migration time.
    // Stored as text here; the FTS index is created via raw SQL in a migration.
    searchText: text("search_text").notNull().default(""),
  },
  (t) => [
    index("articles_status_published_at_idx").on(t.status, t.publishedAt.desc()),
    index("articles_primary_category_idx").on(t.primaryCategoryId, t.publishedAt.desc()),
    index("articles_author_idx").on(t.authorId, t.publishedAt.desc()),
    // Supports the popular ranking: published articles ordered by views desc.
    index("articles_status_view_count_idx").on(t.status, t.viewCount.desc()),
  ],
);

export const articleTags = pgTable(
  "article_tags",
  {
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.articleId, t.tagId] }),
    index("article_tags_tag_idx").on(t.tagId),
  ],
);

// ─────────────────────────────────────────────────────────────
// Domain: translated external wellness briefings
// ─────────────────────────────────────────────────────────────

export const externalContentStatus = pgEnum("external_content_status", [
  "rights_pending",
  "pending_translation",
  "published",
  "failed",
  "withdrawn",
]);

export const externalContentItems = pgTable(
  "external_content_items",
  {
    id: uuid("id").primaryKey().default(idDefault()),
    sourceKey: varchar("source_key", { length: 40 }).notNull(),
    sourceName: varchar("source_name", { length: 120 }).notNull(),
    externalId: varchar("external_id", { length: 500 }).notNull(),
    sourceUrl: text("source_url").notNull(),
    sourceAuthor: varchar("source_author", { length: 200 }),
    sourcePublishedAt: timestamp("source_published_at", {
      withTimezone: true,
    }).notNull(),
    originalTitle: text("original_title").notNull(),
    originalExcerpt: text("original_excerpt").notNull().default(""),
    originalBody: text("original_body").notNull().default(""),
    translatedTitle: text("translated_title"),
    translatedExcerpt: text("translated_excerpt"),
    translatedBody: text("translated_body"),
    summaryLines: jsonb("summary_lines").$type<
      [string, string, string]
    >(),
    summaryProvider: varchar("summary_provider", { length: 40 }),
    summaryModel: varchar("summary_model", { length: 80 }),
    summaryPromptVersion: varchar("summary_prompt_version", { length: 40 }),
    summaryError: varchar("summary_error", { length: 120 }),
    summarizedAt: timestamp("summarized_at", { withTimezone: true }),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    status: externalContentStatus("status")
      .notNull()
      .default("rights_pending"),
    translationProvider: varchar("translation_provider", { length: 40 }),
    translationError: varchar("translation_error", { length: 120 }),
    translatedAt: timestamp("translated_at", { withTimezone: true }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .default(now()),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .default(now()),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(now()),
  },
  (t) => [
    uniqueIndex("external_content_source_external_uidx").on(
      t.sourceKey,
      t.externalId,
    ),
    uniqueIndex("external_content_source_url_uidx").on(t.sourceUrl),
    index("external_content_status_published_idx").on(
      t.status,
      t.sourcePublishedAt.desc(),
    ),
  ],
);

export const externalFeedStates = pgTable("external_feed_states", {
  sourceKey: varchar("source_key", { length: 40 }).primaryKey(),
  etag: text("etag"),
  lastModified: text("last_modified"),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  lastError: varchar("last_error", { length: 120 }),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  leaseToken: varchar("lease_token", { length: 36 }),
  leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(now()),
});

// ─────────────────────────────────────────────────────────────
// Domain: FAQ items
// ─────────────────────────────────────────────────────────────

export const faqItems = pgTable(
  "faq_items",
  {
    id: uuid("id").primaryKey().default(idDefault()),
    articleId: uuid("article_id").references(() => articles.id, {
      onDelete: "cascade",
    }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    question: varchar("question", { length: 240 }).notNull(),
    answerHtml: text("answer_html").notNull(),
    position: integer("position").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  },
  (t) => [
    index("faq_items_article_idx").on(t.articleId, t.position),
    index("faq_items_category_idx").on(t.categoryId, t.position),
  ],
);

// ─────────────────────────────────────────────────────────────
// Domain: How-To items + steps
// ─────────────────────────────────────────────────────────────

export const howtoItems = pgTable("howto_items", {
  id: uuid("id").primaryKey().default(idDefault()),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  primaryCategoryId: uuid("primary_category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  authorId: uuid("author_id").references(() => authors.id, { onDelete: "set null" }),
  estimatedMinutes: integer("estimated_minutes"),
  toolsJson: jsonb("tools_json").$type<string[]>().default([]).notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
});

export const howtoSteps = pgTable(
  "howto_steps",
  {
    id: uuid("id").primaryKey().default(idDefault()),
    howtoId: uuid("howto_id")
      .notNull()
      .references(() => howtoItems.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    bodyHtml: text("body_html").notNull(),
    imageUrl: text("image_url"),
  },
  (t) => [
    uniqueIndex("howto_steps_howto_position_uidx").on(t.howtoId, t.position),
  ],
);

// ─────────────────────────────────────────────────────────────
// Domain: editable site pages (singletons keyed by slug, e.g. "about")
// ─────────────────────────────────────────────────────────────

export const sitePages = pgTable("site_pages", {
  id: uuid("id").primaryKey().default(idDefault()),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  bodyHtml: text("body_html").notNull().default(""),
  bodyJson: jsonb("body_json").$type<unknown>().notNull(),
  seoTitle: varchar("seo_title", { length: 200 }),
  seoDescription: varchar("seo_description", { length: 300 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
});

// ─────────────────────────────────────────────────────────────
// Domain: newsletter subscribers (double opt-in)
// ─────────────────────────────────────────────────────────────

export const subscriberStatus = pgEnum("subscriber_status", [
  "pending",
  "confirmed",
  "unsubscribed",
]);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").primaryKey().default(idDefault()),
    email: varchar("email", { length: 254 }).notNull().unique(),
    status: subscriberStatus("status").notNull().default("pending"),
    source: varchar("source", { length: 60 }),
    consentedAt: timestamp("consented_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  },
  (t) => [index("newsletter_subscribers_status_idx").on(t.status)],
);

export const campaignStatus = pgEnum("campaign_status", [
  "draft",
  "sending",
  "sent",
  "failed",
]);

export const newsletterCampaigns = pgTable(
  "newsletter_campaigns",
  {
    id: uuid("id").primaryKey().default(idDefault()),
    subject: varchar("subject", { length: 200 }).notNull(),
    contentJson: jsonb("content_json").$type<unknown>().notNull(),
    contentHtml: text("content_html").notNull(),
    status: campaignStatus("status").notNull().default("draft"),
    recipientCount: integer("recipient_count").notNull().default(0),
    sentCount: integer("sent_count").notNull().default(0),
    error: text("error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdById: uuid("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  },
  (t) => [index("newsletter_campaigns_created_at_idx").on(t.createdAt.desc())],
);

// ─────────────────────────────────────────────────────────────
// Domain: site settings (single-row, admin-editable)
// ─────────────────────────────────────────────────────────────

export const siteSettings = pgTable("site_settings", {
  // Singleton row keyed by a fixed id.
  id: varchar("id", { length: 20 }).primaryKey().default("default"),
  heroEyebrow: varchar("hero_eyebrow", { length: 120 }).notNull().default(""),
  heroTitle: text("hero_title").notNull().default(""),
  heroSubtitle: text("hero_subtitle").notNull().default(""),
  faviconUrl: text("favicon_url"),
  // Admin-uploaded default Open Graph (social share) image. Overrides the
  // bundled SITE_CONFIG.defaultOgImage site-wide when set.
  ogImageUrl: text("og_image_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

// ─────────────────────────────────────────────────────────────
// Domain: media assets (Vercel Blob)
// ─────────────────────────────────────────────────────────────

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().default(idDefault()),
  url: text("url").notNull(),
  pathname: text("pathname").notNull(),
  contentType: varchar("content_type", { length: 80 }).notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  alt: text("alt"),
  uploadedById: uuid("uploaded_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
});

// ─────────────────────────────────────────────────────────────
// Domain: OWTI assessment funnel events (anonymous analytics)
// ─────────────────────────────────────────────────────────────

// Funnel stages emitted by the OWTI quiz. `start` once per session on open,
// `advance` each time a domain step is completed (step 1–3), `complete` on
// finish (with the resulting 4-letter type code). No per-question answers are
// stored — only progress + final type, keyed by an anonymous random session id.
export const owtiEventType = pgEnum("owti_event_type", [
  "start",
  "advance",
  "complete",
]);

export const owtiEvents = pgTable(
  "owti_events",
  {
    id: uuid("id").primaryKey().default(idDefault()),
    sessionId: varchar("session_id", { length: 40 }).notNull(),
    type: owtiEventType("type").notNull(),
    // advance: the domain step just completed (1–3); null for start/complete.
    step: integer("step"),
    // complete: the resulting 4-letter type code (e.g. "AFCH"); null otherwise.
    code: varchar("code", { length: 4 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(now()),
  },
  (t) => [
    index("owti_events_type_created_idx").on(t.type, t.createdAt),
    index("owti_events_session_idx").on(t.sessionId),
    index("owti_events_created_idx").on(t.createdAt.desc()),
  ],
);

// ─────────────────────────────────────────────────────────────
// OWTI results — 로그인 사용자의 웹·모바일 검사 결과 히스토리
// ─────────────────────────────────────────────────────────────

// Scores are recomputed server-side from the raw answers with the shared
// scoring logic (@owellness/shared/owti). Individual answers are intentionally
// not retained after scoring; only the result summary is stored for history.
export const owtiResults = pgTable(
  "owti_results",
  {
    id: uuid("id").primaryKey().default(idDefault()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Legacy mobile API releases stored answers here. New submissions leave
    // this nullable column empty to preserve the no-individual-answers policy.
    answers: jsonb("answers").$type<Record<string, number>>(),
    // domain key → average score (1–5 float)
    domainAverages: jsonb("domain_averages")
      .notNull()
      .$type<Record<string, number>>(),
    typeCode: varchar("type_code", { length: 4 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(now()),
  },
  (t) => [
    index("owti_results_user_created_idx").on(t.userId, t.createdAt.desc()),
  ],
);

// ─────────────────────────────────────────────────────────────
// Exports for the Auth.js Drizzle adapter binding (infrastructure/auth)
// ─────────────────────────────────────────────────────────────

export const authSchema = {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
} as const;
