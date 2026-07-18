import type { Tag } from "./model";
import type { TagRepository } from "./ports";

export const createTagService = (repo: TagRepository) => ({
  async findBySlug(slug: string): Promise<Tag | null> {
    return repo.findBySlug(slug);
  },
  async listAll(): Promise<Tag[]> {
    return repo.listAll();
  },
});

export type TagService = ReturnType<typeof createTagService>;
