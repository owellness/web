import type { CategorySlug } from "@/config/site";

export type Category = {
  id: string;
  slug: CategorySlug;
  name: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
};
