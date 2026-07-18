// Pure function: extract question-style H2 + following paragraph(s) from
// rendered article HTML so we can synthesize FAQPage JSON-LD. Question
// detection requires the heading to end with `?` (Korean or ASCII).

const stripTags = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const isQuestion = (text: string) => /[?？]\s*$/.test(text);

const H2_REGEX = /<h2\b[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2\b|$)/gi;
const FIRST_P_REGEX = /<p\b[^>]*>([\s\S]*?)<\/p>/i;

export type FaqPair = { question: string; answer: string };

export const extractFaqFromHtml = (html: string): FaqPair[] => {
  const pairs: FaqPair[] = [];
  for (const match of html.matchAll(H2_REGEX)) {
    const headingText = stripTags(match[1] ?? "");
    if (!isQuestion(headingText)) continue;
    const after = match[2] ?? "";
    const p = after.match(FIRST_P_REGEX);
    const answerText = stripTags(p?.[1] ?? "");
    if (!answerText) continue;
    pairs.push({ question: headingText, answer: answerText });
  }
  return pairs;
};
