import type { Metadata } from "next";

import { SITE_URL } from "@/config/site";
import { SajuResultView } from "@/presentation/components/public/saju/SajuResultView";

export const metadata: Metadata = {
  title: "나의 명리 웰니스 리포트 · O! 리듬",
  description: "사주 명리의 상징으로 돌아보는 나의 웰니스 리듬.",
  alternates: { canonical: `${SITE_URL}/saju` },
  robots: { index: false, follow: true },
};

export default function SajuResultPage() {
  return <SajuResultView />;
}
