import { z } from "zod";

import { SLUG_PATTERN } from "@/application/shared/slug";

export type Author = {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  credentials: string | null;
  affiliation: string | null;
  websiteUrl: string | null;
  social: Record<string, string>;
};

// The mutable fields an admin can edit from the profile page. The repository
// receives an already-normalized object (empty strings collapsed to null).
export type AuthorProfileUpdate = {
  displayName: string;
  slug: string;
  bio: string;
  avatarUrl: string | null;
  credentials: string | null;
  affiliation: string | null;
  websiteUrl: string | null;
  social: Record<string, string>;
};

// http(s) URL guard. `.url()` only checks parseability (it would accept
// `javascript:`/`mailto:` URLs), so we additionally require an http(s) scheme
// because these values are rendered into `src`/`href` attributes.
const httpUrl = (max: number) =>
  z
    .string()
    .max(max)
    .url("올바른 URL을 입력하세요.")
    .refine(
      (v) => /^https?:\/\//i.test(v),
      "http:// 또는 https:// 로 시작하는 URL이어야 합니다.",
    );

export const authorProfileSchema = z.object({
  displayName: z.string().min(1, "이름을 입력하세요.").max(120),
  slug: z
    .string()
    .min(1, "슬러그를 입력하세요.")
    .max(80)
    .regex(
      SLUG_PATTERN,
      "슬러그는 영문 소문자·숫자·하이픈만 사용할 수 있습니다. (한글은 자동 로마자 변환됩니다)",
    ),
  bio: z.string().max(2000).default(""),
  avatarUrl: httpUrl(1000).nullable().optional(),
  credentials: z.string().max(200).nullable().optional(),
  affiliation: z.string().max(200).nullable().optional(),
  websiteUrl: httpUrl(500).nullable().optional(),
  social: z.record(z.string(), httpUrl(500)).default({}),
});

export type AuthorProfileInput = z.infer<typeof authorProfileSchema>;
