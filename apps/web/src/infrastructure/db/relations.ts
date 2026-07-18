import { relations } from "drizzle-orm";

import {
  articles,
  articleTags,
  authors,
  categories,
  faqItems,
  howtoItems,
  howtoSteps,
  tags,
  users,
} from "./schema";

export const usersRelations = relations(users, ({ one }) => ({
  author: one(authors, {
    fields: [users.id],
    references: [authors.userId],
  }),
}));

export const authorsRelations = relations(authors, ({ one, many }) => ({
  user: one(users, { fields: [authors.userId], references: [users.id] }),
  articles: many(articles, { relationName: "articleAuthor" }),
  reviewedArticles: many(articles, { relationName: "articleReviewer" }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articles),
  faqItems: many(faqItems),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  author: one(authors, {
    fields: [articles.authorId],
    references: [authors.id],
    relationName: "articleAuthor",
  }),
  medicalReviewer: one(authors, {
    fields: [articles.medicalReviewerId],
    references: [authors.id],
    relationName: "articleReviewer",
  }),
  primaryCategory: one(categories, {
    fields: [articles.primaryCategoryId],
    references: [categories.id],
  }),
  tags: many(articleTags),
  faqItems: many(faqItems),
}));

export const articleTagsRelations = relations(articleTags, ({ one }) => ({
  article: one(articles, {
    fields: [articleTags.articleId],
    references: [articles.id],
  }),
  tag: one(tags, { fields: [articleTags.tagId], references: [tags.id] }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  articles: many(articleTags),
}));

export const faqItemsRelations = relations(faqItems, ({ one }) => ({
  article: one(articles, {
    fields: [faqItems.articleId],
    references: [articles.id],
  }),
  category: one(categories, {
    fields: [faqItems.categoryId],
    references: [categories.id],
  }),
}));

export const howtoItemsRelations = relations(howtoItems, ({ one, many }) => ({
  primaryCategory: one(categories, {
    fields: [howtoItems.primaryCategoryId],
    references: [categories.id],
  }),
  author: one(authors, {
    fields: [howtoItems.authorId],
    references: [authors.id],
  }),
  steps: many(howtoSteps),
}));

export const howtoStepsRelations = relations(howtoSteps, ({ one }) => ({
  howto: one(howtoItems, {
    fields: [howtoSteps.howtoId],
    references: [howtoItems.id],
  }),
}));
