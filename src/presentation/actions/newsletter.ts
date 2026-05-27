"use server";

import { ApplicationError } from "@/application/shared/errors";

import { newsletterService } from "@/composition";

export type NewsletterFormResult =
  | { ok: true; status: "pending" | "already_confirmed" }
  | { ok: false; error: string };

const classifyError = (e: unknown): string => {
  if (e instanceof ApplicationError) return e.message;
  const message = e instanceof Error ? e.message : String(e);
  if (/DATABASE_URL/.test(message) || /placeholder/i.test(message)) {
    return "데이터베이스 연결 설정이 필요합니다. 잠시 후 다시 시도해주세요.";
  }
  if (/RESEND_API_KEY|Resend/i.test(message)) {
    return "메일 발송 설정이 아직 완료되지 않았습니다. 잠시 후 다시 시도해주세요.";
  }
  if (/NEWSLETTER_CONFIRM_SECRET|AUTH_SECRET/i.test(message)) {
    return "서버 보안 설정이 누락되었습니다. 운영자에게 알려주세요.";
  }
  return "구독 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
};

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
    console.error("[subscribeAction]", e);
    return { ok: false, error: classifyError(e) };
  }
}
