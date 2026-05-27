import type { Tag } from "./model";

export interface TagRepository {
  findBySlug(slug: string): Promise<Tag | null>;
  listAll(): Promise<Tag[]>;
}
