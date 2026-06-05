import { z } from "zod";

export const SUBSCRIBER_STATUS = ["pending", "confirmed", "unsubscribed"] as const;
export type SubscriberStatus = (typeof SUBSCRIBER_STATUS)[number];

export type Subscriber = {
  id: string;
  email: string;
  status: SubscriberStatus;
  source: string | null;
  consentedAt: Date | null;
  confirmedAt: Date | null;
  unsubscribedAt: Date | null;
  createdAt: Date;
};

export const subscribeInputSchema = z.object({
  email: z.string().email().max(254),
  source: z.string().max(60).optional(),
  consent: z.literal(true, {
    error: "마케팅 수신 동의는 필수입니다.",
  }),
});

export type SubscribeInput = z.infer<typeof subscribeInputSchema>;

// ── Campaigns (broadcast) ───────────────────────────────────────
export const CAMPAIGN_STATUS = ["draft", "sending", "sent", "failed"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUS)[number];

export type TiptapDocument = { type: "doc"; content?: unknown[] };

export type Campaign = {
  id: string;
  subject: string;
  contentJson: TiptapDocument;
  contentHtml: string;
  status: CampaignStatus;
  recipientCount: number;
  sentCount: number;
  error: string | null;
  sentAt: Date | null;
  createdAt: Date;
};

export const campaignInputSchema = z.object({
  subject: z.string().min(1, "제목을 입력해주세요.").max(200),
  contentJson: z.object({
    type: z.literal("doc"),
    content: z.array(z.unknown()).optional(),
  }),
});

export type CampaignInput = z.infer<typeof campaignInputSchema>;
