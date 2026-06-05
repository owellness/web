"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApplicationError, forbidden } from "@/application/shared/errors";

import { auth } from "@/infrastructure/auth/authConfig";
import { faqService } from "@/composition";

const requireAdmin = async () => {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw forbidden("관리자만 사용할 수 있습니다.");
  }
};

const readInput = (formData: FormData) => ({
  question: String(formData.get("question") ?? "").trim(),
  answer: String(formData.get("answer") ?? "").trim(),
  position: ((): number => {
    const n = Number.parseInt(String(formData.get("position") ?? ""), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  })(),
  // Unchecked checkboxes are omitted from FormData, so presence == checked.
  isPublished: formData.get("isPublished") != null,
});

const refreshPublicCaches = () => {
  revalidatePath("/faq");
  revalidatePath("/admin/faq");
};

export type FaqFormResult = { ok: true } | { ok: false; error: string };

export async function createFaqItemAction(
  formData: FormData,
): Promise<FaqFormResult> {
  try {
    await requireAdmin();
    await faqService.create(readInput(formData));
  } catch (e) {
    if (e instanceof ApplicationError) return { ok: false, error: e.message };
    console.error("[createFaqItemAction]", e);
    return { ok: false, error: "FAQ 추가에 실패했습니다." };
  }
  refreshPublicCaches();
  redirect("/admin/faq");
}

export async function updateFaqItemAction(
  formData: FormData,
): Promise<FaqFormResult> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "잘못된 요청입니다." };
  try {
    await requireAdmin();
    await faqService.update(id, readInput(formData));
  } catch (e) {
    if (e instanceof ApplicationError) return { ok: false, error: e.message };
    console.error("[updateFaqItemAction]", e);
    return { ok: false, error: "FAQ 수정에 실패했습니다." };
  }
  refreshPublicCaches();
  redirect("/admin/faq");
}

export async function deleteFaqItemAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  try {
    await faqService.delete(id);
  } catch (e) {
    console.error("[deleteFaqItemAction]", e);
    throw e;
  }
  refreshPublicCaches();
  redirect("/admin/faq");
}
