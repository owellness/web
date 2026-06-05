"use server";

import { revalidatePath } from "next/cache";

import type { TiptapDocument } from "@/application/newsletter/model";
import { ApplicationError, forbidden } from "@/application/shared/errors";

import { auth } from "@/infrastructure/auth/authConfig";
import { newsletterService } from "@/composition";

const requireAdmin = async () => {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw forbidden("관리자만 사용할 수 있습니다.");
  }
  return session.user;
};

const parseJson = (raw: FormDataEntryValue | null): TiptapDocument => {
  try {
    const v = JSON.parse(String(raw ?? "{}"));
    if (v && typeof v === "object" && v.type === "doc") return v;
  } catch {
    /* fall through */
  }
  return { type: "doc", content: [] };
};

export type CampaignActionResult =
  | { ok: true; kind: "test" | "sent"; sent?: number }
  | { ok: false; error: string };

export async function sendTestCampaignAction(
  formData: FormData,
): Promise<CampaignActionResult> {
  try {
    const user = await requireAdmin();
    const to = String(formData.get("testEmail") ?? "").trim() || user.email;
    if (!to) {
      return { ok: false, error: "테스트 수신 이메일을 입력해주세요." };
    }
    await newsletterService.sendTest(
      {
        subject: String(formData.get("subject") ?? "").trim(),
        contentJson: parseJson(formData.get("contentJson")),
      },
      to,
    );
    return { ok: true, kind: "test" };
  } catch (e) {
    if (e instanceof ApplicationError) return { ok: false, error: e.message };
    console.error("[sendTestCampaignAction]", e);
    return { ok: false, error: "테스트 발송에 실패했습니다." };
  }
}

export async function broadcastCampaignAction(
  formData: FormData,
): Promise<CampaignActionResult> {
  try {
    const user = await requireAdmin();
    const campaign = await newsletterService.broadcast(
      {
        subject: String(formData.get("subject") ?? "").trim(),
        contentJson: parseJson(formData.get("contentJson")),
      },
      user.id,
    );
    revalidatePath("/admin/newsletter");
    return { ok: true, kind: "sent", sent: campaign.sentCount };
  } catch (e) {
    if (e instanceof ApplicationError) return { ok: false, error: e.message };
    console.error("[broadcastCampaignAction]", e);
    return { ok: false, error: "발송에 실패했습니다." };
  }
}
