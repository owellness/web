import type { Author } from "./model";

export interface AuthorRepository {
  findById(id: string): Promise<Author | null>;
  findBySlug(slug: string): Promise<Author | null>;
  findByUserId(userId: string): Promise<Author | null>;
  create(input: {
    userId: string;
    slug: string;
    displayName: string;
    bio?: string;
  }): Promise<Author>;
}
