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
  async revalidateContentIndexes() {
    // sitemap.xml and the two llms.txt feeds each list every published article.
    // Busting their ISR cache here makes a new/removed article appear right
    // away instead of after the routes' 10-minute revalidate window.
    revalidatePath("/sitemap.xml");
    revalidatePath("/llms.txt");
    revalidatePath("/llms-full.txt");
  },
};
