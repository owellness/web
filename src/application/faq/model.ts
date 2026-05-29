import { z } from "zod";

export type FaqItem = {
  id: string;
  question: string;
  // Plain (multi-line) text. Stored in the `answer_html` column for historical
  // reasons; rendered with `whitespace-pre-line` and auto-escaped by React.
  answer: string;
  position: number;
  isPublished: boolean;
};

export const faqItemInputSchema = z.object({
  question: z.string().min(1).max(240),
  answer: z.string().min(1).max(4000),
  position: z.number().int().min(0).max(9999).default(0),
  isPublished: z.boolean().default(true),
});

export type FaqItemInput = z.infer<typeof faqItemInputSchema>;
