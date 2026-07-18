import { notFound, validationFailed } from "@/application/shared/errors";

import { DEFAULT_FAQ_ITEMS } from "./defaults";
import { faqItemInputSchema, type FaqItem } from "./model";
import type { FaqRepository } from "./ports";

const parse = (rawInput: unknown) => {
  const parsed = faqItemInputSchema.safeParse(rawInput);
  if (!parsed.success) throw validationFailed(parsed.error.message);
  return parsed.data;
};

export const createFaqService = (repo: FaqRepository) => ({
  async listAll(): Promise<FaqItem[]> {
    return repo.listAll();
  },

  async listPublished(): Promise<FaqItem[]> {
    return repo.listPublished();
  },

  async findById(id: string): Promise<FaqItem | null> {
    return repo.findById(id);
  },

  // Public read with a safety net: if the table is empty (not yet seeded) or
  // unreachable (e.g. during build), fall back to the in-code defaults so the
  // FAQ page always renders something.
  async listForPublic(): Promise<FaqItem[]> {
    try {
      const items = await repo.listPublished();
      if (items.length > 0) return items;
    } catch (e) {
      console.warn("[faqService.listForPublic]", e);
    }
    return DEFAULT_FAQ_ITEMS.map((item, idx) => ({
      id: `default-${idx}`,
      question: item.question,
      answer: item.answer,
      position: item.position,
      isPublished: item.isPublished,
    }));
  },

  // Only seed when the table is empty — once an admin starts curating FAQs we
  // must not keep re-adding the defaults.
  async ensureSeeded(): Promise<void> {
    const existing = await repo.count();
    if (existing > 0) return;
    await repo.seedMany(DEFAULT_FAQ_ITEMS);
  },

  async create(rawInput: unknown): Promise<FaqItem> {
    return repo.create(parse(rawInput));
  },

  async update(id: string, rawInput: unknown): Promise<FaqItem> {
    const current = await repo.findById(id);
    if (!current) throw notFound("FaqItem");
    return repo.update(id, parse(rawInput));
  },

  async delete(id: string): Promise<void> {
    const current = await repo.findById(id);
    if (!current) throw notFound("FaqItem");
    await repo.delete(id);
  },
});

export type FaqService = ReturnType<typeof createFaqService>;
