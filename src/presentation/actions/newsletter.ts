"use server";

import { ApplicationError } from "@/application/shared/errors";

import { newsletterService } from "@/composition";

export type NewsletterFormResult =
  | { ok: true; status: "pending" | "already_confirmed" }
  | { ok: false; error: string };

export async function subscribeAction(
  formData: FormData,
): Promise<NewsletterFormResult> {
  try {
    const consent = formData.get("consent") === "on";
    const res = await newsletterService.subscribe({
      email: String(formData.get("email") ?? "").trim(),
      source: String(formData.get("source") ?? "newsletter-page"),
      consent,
    });
    return { ok: true, status: res.status };
  } catch (e) {
    if (e instanceof ApplicationError) {
      return { ok: false, error: e.message };
    }
    console.error("[subscribeAction]", e);
    return { ok: false, error: "구독 처리 중 오류가 발생했습니다." };
  }
}
