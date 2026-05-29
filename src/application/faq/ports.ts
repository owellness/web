import type { FaqItem, FaqItemInput } from "./model";

export interface FaqRepository {
  // Admin: every general (site-level) FAQ item, ordered for editing.
  listAll(): Promise<FaqItem[]>;
  // Public: published general FAQ items, ordered by position.
  listPublished(): Promise<FaqItem[]>;
  findById(id: string): Promise<FaqItem | null>;
  count(): Promise<number>;
  create(input: FaqItemInput): Promise<FaqItem>;
  update(id: string, input: FaqItemInput): Promise<FaqItem>;
  delete(id: string): Promise<void>;
  seedMany(items: ReadonlyArray<FaqItemInput>): Promise<void>;
}
