import {
  ApplicationError,
  notFound,
  validationFailed,
} from "@/application/shared/errors";
import { formatZodError } from "@/application/shared/validationMessage";

import { authorProfileSchema, type Author } from "./model";
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

  // Admin-editable profile update. The slug is derived the same way categories
  // are: use the typed slug if present, otherwise romanize the display name.
  async updateProfile(id: string, rawInput: unknown): Promise<Author> {
    const current = await repository.findById(id);
    if (!current) throw notFound("Author");

    const raw = (rawInput ?? {}) as Record<string, unknown>;
    const typedSlug = typeof raw.slug === "string" ? raw.slug : "";
    const nameForSlug =
      typeof raw.displayName === "string" ? raw.displayName : "";
    const slug = slugify(typedSlug) || slugify(nameForSlug);

    const parsed = authorProfileSchema.safeParse({ ...raw, slug });
    if (!parsed.success) throw validationFailed(formatZodError(parsed.error));

    const clash = await repository.findBySlug(parsed.data.slug);
    if (clash && clash.id !== id) {
      throw new ApplicationError(
        "ALREADY_EXISTS",
        `다른 저자가 이미 '${parsed.data.slug}' 슬러그를 사용 중입니다.`,
      );
    }

    return repository.update(id, {
      displayName: parsed.data.displayName,
      slug: parsed.data.slug,
      bio: parsed.data.bio,
      avatarUrl: parsed.data.avatarUrl ?? null,
      credentials: parsed.data.credentials ?? null,
      affiliation: parsed.data.affiliation ?? null,
      websiteUrl: parsed.data.websiteUrl ?? null,
      social: parsed.data.social,
    });
  },
});

export type AuthorService = ReturnType<typeof createAuthorService>;
