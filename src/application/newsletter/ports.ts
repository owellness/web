import type { Campaign, CampaignStatus, Subscriber } from "./model";

export interface SubscriberRepository {
  findByEmail(email: string): Promise<Subscriber | null>;
  listRecent(limit: number): Promise<Subscriber[]>;
  listConfirmedEmails(): Promise<string[]>;
  countByStatus(): Promise<Record<Subscriber["status"], number>>;
  upsertPending(input: {
    email: string;
    source: string | null;
    consentedAt: Date;
  }): Promise<Subscriber>;
  markConfirmed(email: string, at: Date): Promise<Subscriber | null>;
  markUnsubscribed(email: string, at: Date): Promise<Subscriber | null>;
}

export interface CampaignRepository {
  create(input: {
    subject: string;
    contentJson: unknown;
    contentHtml: string;
    status: CampaignStatus;
    recipientCount: number;
    createdById: string | null;
  }): Promise<Campaign>;
  finalize(
    id: string,
    update: {
      status: CampaignStatus;
      sentCount: number;
      error: string | null;
      sentAt: Date | null;
    },
  ): Promise<void>;
  listRecent(limit: number): Promise<Campaign[]>;
}

export type BroadcastRecipient = { email: string; unsubscribeUrl: string };

export interface NewsletterBroadcaster {
  /** Sends one rendered campaign to all recipients. Returns delivered count. */
  sendBroadcast(input: {
    subject: string;
    html: string;
    recipients: BroadcastRecipient[];
  }): Promise<{ sent: number }>;
}

export interface CampaignHtmlRenderer {
  render(contentJson: unknown): Promise<string>;
}

export type ConfirmEmail = {
  to: string;
  confirmUrl: string;
  unsubscribeUrl: string;
  brandName: string;
};

export interface NewsletterMailer {
  sendConfirm(email: ConfirmEmail): Promise<void>;
}

export interface ConfirmTokenSigner {
  sign(payload: { email: string; purpose: "confirm" | "unsubscribe" }): string;
  verify(
    token: string,
    expectedPurpose: "confirm" | "unsubscribe",
  ): { email: string } | null;
}
