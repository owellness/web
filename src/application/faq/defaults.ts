import { SITE_NAME } from "@/config/site";

import type { FaqItemInput } from "./model";

// Seeded once into `faq_items` (and used as a render-time fallback when the DB
// is empty/unavailable) so the public FAQ page is never blank.
export const DEFAULT_FAQ_ITEMS: ReadonlyArray<FaqItemInput> = [
  {
    question: `${SITE_NAME}은 어떤 서비스인가요?`,
    answer:
      "수면·영양·운동·여성 건강 영역에서 근거 기반 가이드를 매주 발행하는 웰니스 콘텐츠 허브입니다. 추후 출시될 오 웰니스 앱과 함께 진단·코칭 경험을 제공합니다.",
    position: 0,
    isPublished: true,
  },
  {
    question: "의료적인 진단을 받을 수 있나요?",
    answer:
      "오 웰니스의 콘텐츠는 정보 제공을 목적으로 하며 의료 전문가의 진단·치료를 대체하지 않습니다. 증상이 있는 경우 반드시 의료기관을 방문해주세요.",
    position: 1,
    isPublished: true,
  },
  {
    question: "콘텐츠의 출처는 어디인가요?",
    answer:
      "각 아티클의 통계·주장은 학술 논문, 가이드라인, 공인된 출처를 인용합니다. 의료 관련 콘텐츠는 의료 검토자가 검토한 후 공개됩니다.",
    position: 2,
    isPublished: true,
  },
  {
    question: "뉴스레터는 얼마나 자주 발행되나요?",
    answer:
      "주 1회 발행을 목표로 하며, 새 콘텐츠와 함께 이번 주의 인사이트를 정리해 보내드립니다.",
    position: 3,
    isPublished: true,
  },
];
