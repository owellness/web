import { revalidatePath } from "next/cache";

import type { RevalidationPort } from "@/application/articles/ports";

export const nextRevalidation: RevalidationPort = {
  async revalidateArticle(slug, categorySlug) {
    revalidatePath(`/${categorySlug}/${slug}`);
  },
  async revalidateCategory(categorySlug) {
    revalidatePath(`/${categorySlug}`);
  },
  async revalidateHome() {
    revalidatePath("/");
  },
};
