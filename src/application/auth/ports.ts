export type MagicLinkEmail = {
  to: string;
  url: string;
  brandName: string;
  expiresInMinutes: number;
};

export interface MagicLinkSender {
  send(email: MagicLinkEmail): Promise<void>;
}
