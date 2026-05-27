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
