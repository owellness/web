import { z } from "zod";

import { SLUG_PATTERN } from "@/application/shared/slug";

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

export const categoryInputSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(
      SLUG_PATTERN,
      "슬러그는 한글·영문·숫자와 하이픈(-)만 사용할 수 있습니다.",
    ),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).default(""),
  seoTitle: z.string().max(200).nullable().optional(),
  seoDescription: z.string().max(300).nullable().optional(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
