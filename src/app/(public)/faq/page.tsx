import type { Metadata } from "next";

import { buildFaqJsonLd } from "@/application/seo/jsonld";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { JsonLd } from "@/presentation/components/public/JsonLd";

import { faqService } from "@/composition";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description: `${SITE_NAME}에 대해 자주 묻는 질문과 답변을 정리했습니다.`,
  alternates: { canonical: `${SITE_URL}/faq` },
};

export default async function FaqPage() {
  const items = await faqService.listForPublic();

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      {items.length > 0 ? (
        <JsonLd
          schema={buildFaqJsonLd(
            items.map((item) => ({
              question: item.question,
              answerHtml: item.answer,
            })),
          )}
        />
      ) : null}
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          FAQ
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          자주 묻는 질문
        </h1>
      </header>
      <dl className="mt-10 space-y-8">
        {items.map((item) => (
          <div key={item.id} className="border-b border-border pb-6">
            <dt className="text-lg font-semibold text-foreground">
              {item.question}
            </dt>
            <dd className="speakable mt-2 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
              {item.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
