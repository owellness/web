"use server";

import { revalidatePath } from "next/cache";

import { ApplicationError, forbidden } from "@/application/shared/errors";

import { auth } from "@/infrastructure/auth/authConfig";
import { settingsService } from "@/composition";

const requireAdmin = async () => {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw forbidden("관리자만 사용할 수 있습니다.");
  }
};

const nullableUrl = (raw: FormDataEntryValue | null): string | null => {
  const v = String(raw ?? "").trim();
  return v.length > 0 ? v : null;
};

export type SettingsFormResult = { ok: true } | { ok: false; error: string };

export async function updateSettingsAction(
  formData: FormData,
): Promise<SettingsFormResult> {
  try {
    await requireAdmin();
    await settingsService.update({
      heroEyebrow: String(formData.get("heroEyebrow") ?? "").trim(),
      heroTitle: String(formData.get("heroTitle") ?? "").trim(),
      heroSubtitle: String(formData.get("heroSubtitle") ?? "").trim(),
      faviconUrl: nullableUrl(formData.get("faviconUrl")),
      ogImageUrl: nullableUrl(formData.get("ogImageUrl")),
    });
  } catch (e) {
    if (e instanceof ApplicationError) return { ok: false, error: e.message };
    console.error("[updateSettingsAction]", e);
    return { ok: false, error: "설정 저장에 실패했습니다." };
  }
  // Home hero + favicon (root layout) are cached — refresh both.
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true };
}
