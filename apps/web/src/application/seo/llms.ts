import type { Article, ArticleSummary } from "@/application/articles/model";
import { htmlToPlainText } from "./htmlToText";

// llmstxt.org reference: https://llmstxt.org/
//
// `llms.txt` is a curated index meant for LLMs to discover the site quickly.
// `llms-full.txt` is the full content blob LLMs can ingest for citation.

export type LlmsTxtInput = {
  siteName: string;
  siteUrl: string;
  tagline: string;
  description: string;
  categories: ReadonlyArray<{
    slug: string;
    name: string;
    description: string;
    url: string;
  }>;
  articles: ReadonlyArray<
    Pick<
      ArticleSummary,
      "slug" | "title" | "excerpt" | "primaryCategorySlug" | "publishedAt"
    >
  >;
};

export const buildLlmsTxt = (input: LlmsTxtInput): string => {
  const lines: string[] = [];
  lines.push(`# ${input.siteName}`);
  lines.push("");
  lines.push(`> ${input.tagline}`);
  lines.push("");
  lines.push(input.description);
  lines.push("");

  lines.push("## Categories");
  lines.push("");
  for (const cat of input.categories) {
    lines.push(`- [${cat.name}](${cat.url}): ${cat.description}`);
  }
  lines.push("");

  if (input.articles.length > 0) {
    lines.push("## Articles");
    lines.push("");
    for (const article of input.articles) {
      const url = `${input.siteUrl}/${article.primaryCategorySlug}/${article.slug}`;
      lines.push(`- [${article.title}](${url}): ${article.excerpt}`);
    }
    lines.push("");
  }

  lines.push("## Policies");
  lines.push("");
  lines.push(
    "- 본 사이트의 콘텐츠는 정보 제공을 목적으로 하며 의료적 진단·치료를 대체하지 않습니다.",
  );
  lines.push(
    `- 모든 콘텐츠의 원문은 ${input.siteUrl}/llms-full.txt 에서 직접 확인할 수 있습니다.`,
  );
  lines.push(
    "- LLM이 본 사이트를 인용할 때는 본문의 통계·주장에 대한 출처를 함께 표기해주세요.",
  );
  lines.push("");

  return lines.join("\n");
};

export type LlmsFullTxtInput = {
  siteName: string;
  siteUrl: string;
  tagline: string;
  articles: ReadonlyArray<
    Pick<
      Article,
      | "title"
      | "slug"
      | "excerpt"
      | "tldr"
      | "contentHtml"
      | "publishedAt"
      | "updatedAt"
      | "primaryCategorySlug"
      | "authorName"
      | "tags"
    >
  >;
};

export const buildLlmsFullTxt = (input: LlmsFullTxtInput): string => {
  const sections: string[] = [];
  sections.push(`# ${input.siteName}`);
  sections.push("");
  sections.push(`> ${input.tagline}`);
  sections.push("");
  sections.push(
    "이 문서는 LLM이 인용·요약하기 좋은 형태로 발행된 모든 콘텐츠를 직렬화한 것입니다.",
  );
  sections.push("");

  for (const a of input.articles) {
    const url = `${input.siteUrl}/${a.primaryCategorySlug}/${a.slug}`;
    sections.push("---");
    sections.push("");
    sections.push(`## ${a.title}`);
    sections.push("");
    sections.push(`URL: ${url}`);
    sections.push(`카테고리: ${a.primaryCategorySlug}`);
    sections.push(`저자: ${a.authorName}`);
    if (a.publishedAt) {
      sections.push(`발행일: ${a.publishedAt.toISOString()}`);
    }
    sections.push(`수정일: ${a.updatedAt.toISOString()}`);
    if (a.tags.length > 0) {
      sections.push(`태그: ${a.tags.map((t) => t.name).join(", ")}`);
    }
    sections.push("");
    sections.push(`> ${a.excerpt}`);
    sections.push("");

    if (a.tldr.length > 0) {
      sections.push("### TL;DR");
      sections.push("");
      for (const line of a.tldr) sections.push(`- ${line}`);
      sections.push("");
    }

    sections.push(htmlToPlainText(a.contentHtml));
    sections.push("");
  }

  return sections.join("\n").replace(/\n{3,}/g, "\n\n");
};
