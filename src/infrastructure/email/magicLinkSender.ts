import type { MagicLinkSender } from "@/application/auth/ports";
import { RESEND_FROM, resend } from "./resendClient";

const renderHtml = ({
  url,
  brandName,
  expiresInMinutes,
}: {
  url: string;
  brandName: string;
  expiresInMinutes: number;
}) => `<!doctype html>
<html lang="ko"><head><meta charset="utf-8" />
<title>${brandName} 로그인</title></head>
<body style="font-family:Pretendard,-apple-system,system-ui,sans-serif;background:#fafafa;padding:32px;color:#111">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #eee">
    <h1 style="font-size:20px;margin:0 0 16px">${brandName} 관리자 로그인</h1>
    <p style="font-size:14px;line-height:1.6;margin:0 0 24px;color:#444">
      아래 버튼을 눌러 로그인하세요. 링크는 ${expiresInMinutes}분 동안만 유효합니다.
    </p>
    <p style="margin:0 0 24px">
      <a href="${url}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px">
        로그인 링크 열기
      </a>
    </p>
    <p style="font-size:12px;color:#888;margin:0">
      이 메일을 요청하지 않았다면 무시해도 됩니다.
    </p>
  </div>
</body></html>`;

const renderText = ({
  url,
  brandName,
  expiresInMinutes,
}: {
  url: string;
  brandName: string;
  expiresInMinutes: number;
}) =>
  `${brandName} 관리자 로그인\n\n아래 링크는 ${expiresInMinutes}분 동안 유효합니다.\n${url}\n\n요청한 적이 없다면 이 메일을 무시하세요.`;

export const resendMagicLinkSender: MagicLinkSender = {
  async send({ to, url, brandName, expiresInMinutes }) {
    const { error } = await resend.emails.send({
      from: RESEND_FROM,
      to,
      subject: `${brandName} 관리자 로그인 링크`,
      html: renderHtml({ url, brandName, expiresInMinutes }),
      text: renderText({ url, brandName, expiresInMinutes }),
    });
    if (error) {
      throw new Error(`Failed to send magic link: ${error.message}`);
    }
  },
};
