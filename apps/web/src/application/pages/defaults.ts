import type { TiptapDocument } from "@/application/articles/model";
import { SITE_NAME } from "@/config/site";

export const ABOUT_SLUG = "about";

export type DefaultPage = {
  title: string;
  bodyJson: TiptapDocument;
  seoTitle: string | null;
  seoDescription: string | null;
};

const heading = (text: string): unknown => ({
  type: "heading",
  attrs: { level: 2 },
  content: [{ type: "text", text }],
});

const paragraph = (text: string): unknown => ({
  type: "paragraph",
  content: [{ type: "text", text }],
});

const bullet = (text: string): unknown => ({
  type: "listItem",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

// Authored as a Tiptap doc so the admin can keep editing it in the WYSIWYG
// editor. `pageService.ensureSeeded()` renders this to sanitized HTML on first
// run; admins can then freely rewrite it.
const aboutBodyJson: TiptapDocument = {
  type: "doc",
  content: [
    paragraph(
      `${SITE_NAME}은 수면, 영양, 운동, 여성 건강 영역의 근거 기반 웰니스 콘텐츠를 매주 발행하는 콘텐츠 허브입니다. 검증되지 않은 정보가 넘쳐나는 건강 분야에서, 누구나 믿고 따를 수 있는 가이드를 제공하는 것을 목표로 합니다.`,
    ),
    heading("우리가 믿는 것"),
    paragraph(
      "건강 정보는 어렵지 않아야 하고, 동시에 정확해야 합니다. 우리는 학술 논문과 공인된 가이드라인을 근거로, 일상에서 바로 실천할 수 있는 형태로 콘텐츠를 정리합니다.",
    ),
    heading("다루는 주제"),
    {
      type: "bulletList",
      content: [
        bullet("수면 · 스트레스 · 정신건강 — 수면 위생, 번아웃 회복, 명상"),
        bullet("영양 · 다이어트 · 식이요법 — 지속 가능한 식습관과 영양제 가이드"),
        bullet("운동 · 홈트 · 근력 — 초보부터 중급까지의 루틴과 자세 교정"),
        bullet("여성 · 호르몬 · 갱년기 — 라이프스테이지별 여성 건강 관리"),
      ],
    },
    heading("콘텐츠 원칙"),
    paragraph(
      "모든 통계와 주장에는 출처를 함께 표기합니다. 의료와 관련된 콘텐츠는 의료 검토자가 검토한 뒤 공개되며, 정보 제공을 목적으로 할 뿐 전문가의 진단·치료를 대체하지 않습니다.",
    ),
    heading("앞으로의 계획"),
    paragraph(
      `${SITE_NAME}은 곧 출시될 웰니스 진단·코칭 앱과 함께, 콘텐츠에서 한 걸음 더 나아간 개인화된 건강 관리 경험을 준비하고 있습니다. 뉴스레터를 구독하시면 새 콘텐츠와 앱 베타 소식을 가장 먼저 받아보실 수 있습니다.`,
    ),
  ],
};

export const DEFAULT_PAGES: Readonly<Record<string, DefaultPage>> = {
  [ABOUT_SLUG]: {
    title: `${SITE_NAME} 소개`,
    bodyJson: aboutBodyJson,
    seoTitle: `${SITE_NAME} 소개`,
    seoDescription: `${SITE_NAME}은 수면·영양·운동·여성 건강 영역의 근거 기반 웰니스 콘텐츠를 발행하는 콘텐츠 허브입니다.`,
  },
};
