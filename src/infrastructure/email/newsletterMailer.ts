import type { NewsletterMailer } from "@/application/newsletter/ports";

import { RESEND_FROM, resend } from "./resendClient";

const renderHtml = ({
  brandName,
  confirmUrl,
  unsubscribeUrl,
}: {
  brandName: string;
  confirmUrl: string;
  unsubscribeUrl: string;
}) => `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>${brandName} 뉴스레터 구독 확인</title></head>
<body style="font-family:Pretendard,-apple-system,system-ui,sans-serif;background:#fafafa;padding:32px;color:#111">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #eee">
    <h1 style="font-size:20px;margin:0 0 16px">${brandName} 뉴스레터 구독을 확인해주세요</h1>
    <p style="font-size:14px;line-height:1.6;margin:0 0 24px;color:#444">
      아래 버튼을 눌러 구독을 완료하세요. 확인 후 매주 인사이트를 보내드립니다.
    </p>
    <p style="margin:0 0 24px">
      <a href="${confirmUrl}" style="display:inline-block;background:#3b7a57;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px">
        구독 확인
      </a>
    </p>
    <p style="font-size:12px;color:#888;margin:0 0 8px">
      이 메일을 요청하지 않았다면 무시해도 됩니다.
    </p>
    <p style="font-size:12px;color:#888;margin:0">
      <a href="${unsubscribeUrl}" style="color:#888">구독 해지하기</a>
    </p>
  </div>
</body></html>`;

export const resendNewsletterMailer: NewsletterMailer = {
  async sendConfirm({ to, confirmUrl, unsubscribeUrl, brandName }) {
    const { error } = await resend.emails.send({
      from: RESEND_FROM,
      to,
      subject: `${brandName} 뉴스레터 구독을 확인해주세요`,
      html: renderHtml({ brandName, confirmUrl, unsubscribeUrl }),
      text: `${brandName} 뉴스레터 구독을 확인하려면 아래 링크를 여세요.\n${confirmUrl}\n\n구독 해지: ${unsubscribeUrl}`,
    });
    if (error) {
      throw new Error(`Failed to send confirm email: ${error.message}`);
    }
  },
};
