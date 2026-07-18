"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApplicationError, forbidden } from "@/application/shared/errors";

import { auth } from "@/infrastructure/auth/authConfig";
import { categoryService } from "@/composition";

const requireAdmin = async () => {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw forbidden("관리자만 사용할 수 있습니다.");
  }
};

const readInput = (formData: FormData) => ({
  slug: String(formData.get("slug") ?? "").trim(),
  name: String(formData.get("name") ?? "").trim(),
  description: String(formData.get("description") ?? ""),
  seoTitle: ((): string | null => {
    const v = String(formData.get("seoTitle") ?? "").trim();
    return v.length > 0 ? v : null;
  })(),
  seoDescription: ((): string | null => {
    const v = String(formData.get("seoDescription") ?? "").trim();
    return v.length > 0 ? v : null;
  })(),
});

const refreshPublicCaches = () => {
  revalidatePath("/");
  revalidatePath("/admin/categories");
};

export type CategoryFormResult = { ok: true } | { ok: false; error: string };

export async function createCategoryAction(
  formData: FormData,
): Promise<CategoryFormResult> {
  try {
    await requireAdmin();
    await categoryService.create(readInput(formData));
  } catch (e) {
    if (e instanceof ApplicationError) return { ok: false, error: e.message };
    console.error("[createCategoryAction]", e);
    return { ok: false, error: "카테고리 생성에 실패했습니다." };
  }
  refreshPublicCaches();
  redirect("/admin/categories");
}

export async function updateCategoryAction(
  formData: FormData,
): Promise<CategoryFormResult> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "잘못된 요청입니다." };
  try {
    await requireAdmin();
    await categoryService.update(id, readInput(formData));
  } catch (e) {
    if (e instanceof ApplicationError) return { ok: false, error: e.message };
    console.error("[updateCategoryAction]", e);
    return { ok: false, error: "카테고리 수정에 실패했습니다." };
  }
  refreshPublicCaches();
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  try {
    await categoryService.delete(id);
  } catch (e) {
    console.error("[deleteCategoryAction]", e);
    // FK restrict: articles still attached to this category.
    const message = e instanceof Error ? e.message : String(e);
    if (/violates foreign key|article/i.test(message)) {
      redirect("/admin/categories?error=has-articles");
    }
    throw e;
  }
  refreshPublicCaches();
  redirect("/admin/categories");
}
