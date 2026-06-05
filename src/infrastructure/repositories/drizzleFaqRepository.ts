import { and, asc, count, eq, isNull } from "drizzle-orm";

import type { FaqItem, FaqItemInput } from "@/application/faq/model";
import type { FaqRepository } from "@/application/faq/ports";

import { db } from "@/infrastructure/db/client";
import { faqItems } from "@/infrastructure/db/schema";

type Row = typeof faqItems.$inferSelect;

const mapItem = (row: Row): FaqItem => ({
  id: row.id,
  question: row.question,
  answer: row.answerHtml,
  position: row.position,
  isPublished: row.isPublished,
});

// Site-level FAQs are the rows not attached to a specific article.
const isGeneral = isNull(faqItems.articleId);

export const drizzleFaqRepository: FaqRepository = {
  async listAll(): Promise<FaqItem[]> {
    const rows = await db
      .select()
      .from(faqItems)
      .where(isGeneral)
      .orderBy(asc(faqItems.position), asc(faqItems.createdAt));
    return rows.map(mapItem);
  },

  async listPublished(): Promise<FaqItem[]> {
    const rows = await db
      .select()
      .from(faqItems)
      .where(and(isGeneral, eq(faqItems.isPublished, true)))
      .orderBy(asc(faqItems.position), asc(faqItems.createdAt));
    return rows.map(mapItem);
  },

  async findById(id) {
    const [row] = await db
      .select()
      .from(faqItems)
      .where(eq(faqItems.id, id))
      .limit(1);
    return row ? mapItem(row) : null;
  },

  async count(): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(faqItems)
      .where(isGeneral);
    return Number(row?.value ?? 0);
  },

  async create(input: FaqItemInput) {
    const [row] = await db
      .insert(faqItems)
      .values({
        articleId: null,
        categoryId: null,
        question: input.question,
        answerHtml: input.answer,
        position: input.position,
        isPublished: input.isPublished,
      })
      .returning();
    return mapItem(row);
  },

  async update(id, input: FaqItemInput) {
    const [row] = await db
      .update(faqItems)
      .set({
        question: input.question,
        answerHtml: input.answer,
        position: input.position,
        isPublished: input.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(faqItems.id, id))
      .returning();
    if (!row) throw new Error(`FaqItem(${id}) not found`);
    return mapItem(row);
  },

  async delete(id) {
    await db.delete(faqItems).where(eq(faqItems.id, id));
  },

  async seedMany(items) {
    if (items.length === 0) return;
    await db.insert(faqItems).values(
      items.map((item) => ({
        articleId: null,
        categoryId: null,
        question: item.question,
        answerHtml: item.answer,
        position: item.position,
        isPublished: item.isPublished,
      })),
    );
  },
};
