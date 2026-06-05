import type {
  NewsletterBroadcaster,
  NewsletterMailer,
} from "@/application/newsletter/ports";
import { SITE_NAME, SITE_URL } from "@/config/site";

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

// Wraps the admin-authored article body in a simple, inline-styled email shell
// with a per-recipient unsubscribe footer.
const renderCampaignHtml = (bodyHtml: string, unsubscribeUrl: string) =>
  `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#f4f2ec;padding:24px;font-family:Pretendard,-apple-system,system-ui,sans-serif;color:#14110f">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:14px;border:1px solid #e7e2d8;overflow:hidden">
    <div style="padding:28px 28px 8px">
      <a href="${SITE_URL}" style="font-size:15px;font-weight:700;color:#3b7a57;text-decoration:none">${SITE_NAME}</a>
    </div>
    <div style="padding:8px 28px 28px;font-size:16px;line-height:1.75">${bodyHtml}</div>
    <div style="border-top:1px solid #eee;padding:18px 28px;font-size:12px;color:#888">
      이 메일은 ${SITE_NAME} 뉴스레터를 구독하셔서 발송되었습니다.<br/>
      <a href="${unsubscribeUrl}" style="color:#888">구독 해지</a> · <a href="${SITE_URL}" style="color:#888">${SITE_URL}</a>
    </div>
  </div>
</body></html>`;

const stripTags = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const BATCH_SIZE = 100;

export const resendNewsletterBroadcaster: NewsletterBroadcaster = {
  async sendBroadcast({ subject, html, recipients }) {
    let sent = 0;
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const chunk = recipients.slice(i, i + BATCH_SIZE);
      const payload = chunk.map((r) => ({
        from: RESEND_FROM,
        to: r.email,
        subject,
        html: renderCampaignHtml(html, r.unsubscribeUrl),
        text: `${stripTags(html)}\n\n구독 해지: ${r.unsubscribeUrl}`,
        headers: {
          "List-Unsubscribe": `<${r.unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }));
      const { error } = await resend.batch.send(payload);
      if (error) {
        throw new Error(
          `Resend batch failed at ${i}-${i + chunk.length}: ${error.message}`,
        );
      }
      sent += chunk.length;
    }
    return { sent };
  },
};
