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
  if (/RESEND_API_KEY is required/i.test(message)) {
    return "메일 발송 키가 설정되지 않았습니다. 운영자에게 알려주세요.";
  }
  // Resend test mode: can only send to the account owner until a domain is
  // verified. This is the most common cause for public subscribers.
  if (
    /verify a domain|testing emails|own email address|not allowed to send/i.test(
      message,
    )
  ) {
    return "현재 발신 도메인 인증이 완료되지 않아 확인 메일을 보낼 수 없습니다. 운영자에게 문의해주세요.";
  }
  if (/Resend|from.*address|domain is not verified/i.test(message)) {
    return "메일 발송 설정에 문제가 있습니다. 운영자에게 알려주세요.";
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
