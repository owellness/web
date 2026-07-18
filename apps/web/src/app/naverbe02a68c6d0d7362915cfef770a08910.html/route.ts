// Naver Search Advisor (네이버 서치어드바이저) site-ownership verification file.
//
// Naver fetches https://www.owellness.co.kr/naverbe02a68c6d0d7362915cfef770a08910.html
// and checks its contents. This app ships no public/ directory, so — exactly like
// /robots.txt, /sitemap.xml and /llms.txt — we serve it from a route handler whose
// folder name *is* the requested path. The body is the single line Naver's
// downloaded verification file contains: "naver-site-verification: <filename>".
//
// This is a belt-and-suspenders companion to the <meta name="naver-site-verification">
// tag emitted from the root layout (see src/config/site.ts); either method on its own
// is sufficient for Naver to confirm ownership.

const VERIFICATION_BODY =
  "naver-site-verification: naverbe02a68c6d0d7362915cfef770a08910.html";

export function GET() {
  return new Response(VERIFICATION_BODY, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
