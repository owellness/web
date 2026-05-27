import type { Subscriber } from "./model";

export interface SubscriberRepository {
  findByEmail(email: string): Promise<Subscriber | null>;
  upsertPending(input: {
    email: string;
    source: string | null;
    consentedAt: Date;
  }): Promise<Subscriber>;
  markConfirmed(email: string, at: Date): Promise<Subscriber | null>;
  markUnsubscribed(email: string, at: Date): Promise<Subscriber | null>;
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
