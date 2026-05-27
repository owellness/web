import type { Metadata } from "next";

import { buildFaqJsonLd } from "@/application/seo/jsonld";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { JsonLd } from "@/presentation/components/public/JsonLd";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description: `${SITE_NAME}에 대해 자주 묻는 질문과 답변을 정리했습니다.`,
  alternates: { canonical: `${SITE_URL}/faq` },
};

const FAQ_ITEMS = [
  {
    question: `${SITE_NAME}은 어떤 서비스인가요?`,
    answerHtml:
      "수면·영양·운동·여성 건강 영역에서 근거 기반 가이드를 매주 발행하는 웰니스 콘텐츠 허브입니다. 추후 출시될 오 웰니스 앱과 함께 진단·코칭 경험을 제공합니다.",
  },
  {
    question: "의료적인 진단을 받을 수 있나요?",
    answerHtml:
      "오 웰니스의 콘텐츠는 정보 제공을 목적으로 하며 의료 전문가의 진단·치료를 대체하지 않습니다. 증상이 있는 경우 반드시 의료기관을 방문해주세요.",
  },
  {
    question: "콘텐츠의 출처는 어디인가요?",
    answerHtml:
      "각 아티클의 통계·주장은 학술 논문, 가이드라인, 공인된 출처를 인용합니다. 의료 관련 콘텐츠는 의료 검토자가 검토한 후 공개됩니다.",
  },
  {
    question: "뉴스레터는 얼마나 자주 발행되나요?",
    answerHtml:
      "주 1회 발행을 목표로 하며, 새 콘텐츠와 함께 이번 주의 인사이트를 정리해 보내드립니다.",
  },
];

export default function FaqPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <JsonLd
        schema={buildFaqJsonLd(
          FAQ_ITEMS.map((item) => ({
            question: item.question,
            answerHtml: item.answerHtml,
          })),
        )}
      />
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          FAQ
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          자주 묻는 질문
        </h1>
      </header>
      <dl className="mt-10 space-y-8">
        {FAQ_ITEMS.map((item) => (
          <div key={item.question} className="border-b border-border pb-6">
            <dt className="text-lg font-semibold text-foreground">
              {item.question}
            </dt>
            <dd className="speakable mt-2 text-base leading-relaxed text-muted-foreground">
              {item.answerHtml}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
