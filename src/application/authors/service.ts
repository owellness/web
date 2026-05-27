import type { Author } from "./model";
import type { AuthorRepository } from "./ports";

export type AuthorServiceDeps = {
  repository: AuthorRepository;
  slugify: (input: string) => string;
};

const fallbackSlug = (email: string) =>
  email.split("@")[0]?.toLowerCase() ?? "author";

export const createAuthorService = ({
  repository,
  slugify,
}: AuthorServiceDeps) => ({
  async findById(id: string): Promise<Author | null> {
    return repository.findById(id);
  },

  async findBySlug(slug: string): Promise<Author | null> {
    return repository.findBySlug(slug);
  },

  async getOrCreateForUser(input: {
    userId: string;
    email: string;
    name?: string | null;
  }): Promise<Author> {
    const existing = await repository.findByUserId(input.userId);
    if (existing) return existing;

    const displayName = (
      input.name?.trim() ||
      input.email.split("@")[0] ||
      "관리자"
    ).slice(0, 120);
    const baseSlug = slugify(displayName) || fallbackSlug(input.email);
    const slug = baseSlug.slice(0, 80) || "author";
    return repository.create({
      userId: input.userId,
      slug,
      displayName,
      bio: "",
    });
  },
});

export type AuthorService = ReturnType<typeof createAuthorService>;
