"use server";

import { revalidatePath } from "next/cache";

import type { TiptapDocument } from "@/application/articles/model";
import { ApplicationError, forbidden } from "@/application/shared/errors";

import { auth } from "@/infrastructure/auth/authConfig";
import { pageService } from "@/composition";

const requireAdmin = async () => {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw forbidden("관리자만 사용할 수 있습니다.");
  }
};

const parseJson = (raw: FormDataEntryValue | null): TiptapDocument => {
  try {
    return JSON.parse(String(raw ?? "{}"));
  } catch {
    return { type: "doc", content: [] };
  }
};

const nullableString = (raw: FormDataEntryValue | null): string | null => {
  const value = String(raw ?? "").trim();
  return value.length > 0 ? value : null;
};

export type PageFormResult = { ok: true } | { ok: false; error: string };

export async function savePageAction(
  formData: FormData,
): Promise<PageFormResult> {
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return { ok: false, error: "잘못된 요청입니다." };
  try {
    await requireAdmin();
    await pageService.save(slug, {
      title: String(formData.get("title") ?? "").trim(),
      bodyJson: parseJson(formData.get("bodyJson")),
      seoTitle: nullableString(formData.get("seoTitle")),
      seoDescription: nullableString(formData.get("seoDescription")),
    });
  } catch (e) {
    if (e instanceof ApplicationError) return { ok: false, error: e.message };
    console.error("[savePageAction]", e);
    return { ok: false, error: "페이지 저장에 실패했습니다." };
  }
  // Public route mirrors the slug (e.g. "about" -> /about).
  revalidatePath(`/${slug}`);
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${slug}/edit`);
  return { ok: true };
}
