import {
  ApplicationError,
  notFound,
  validationFailed,
} from "@/application/shared/errors";
import {
  campaignInputSchema,
  subscribeInputSchema,
  type Campaign,
  type Subscriber,
  type SubscribeInput,
} from "./model";
import type {
  CampaignHtmlRenderer,
  CampaignRepository,
  ConfirmTokenSigner,
  NewsletterBroadcaster,
  NewsletterMailer,
  SubscriberRepository,
} from "./ports";

export type NewsletterServiceDeps = {
  repository: SubscriberRepository;
  campaigns: CampaignRepository;
  mailer: NewsletterMailer;
  broadcaster: NewsletterBroadcaster;
  htmlRenderer: CampaignHtmlRenderer;
  tokens: ConfirmTokenSigner;
  brandName: string;
  buildConfirmUrl: (token: string) => string;
  buildUnsubscribeUrl: (token: string) => string;
};

export const createNewsletterService = (deps: NewsletterServiceDeps) => ({
  async subscribe(rawInput: unknown): Promise<{ status: "pending" | "already_confirmed" }> {
    const parsed = subscribeInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw validationFailed(parsed.error.message);
    }
    const input: SubscribeInput = parsed.data;

    const existing = await deps.repository.findByEmail(input.email);
    if (existing?.status === "confirmed") {
      return { status: "already_confirmed" };
    }

    await deps.repository.upsertPending({
      email: input.email,
      source: input.source ?? null,
      consentedAt: new Date(),
    });

    const token = deps.tokens.sign({ email: input.email, purpose: "confirm" });
    const unsubscribeToken = deps.tokens.sign({
      email: input.email,
      purpose: "unsubscribe",
    });

    await deps.mailer.sendConfirm({
      to: input.email,
      confirmUrl: deps.buildConfirmUrl(token),
      unsubscribeUrl: deps.buildUnsubscribeUrl(unsubscribeToken),
      brandName: deps.brandName,
    });

    return { status: "pending" };
  },

  async confirm(token: string): Promise<Subscriber> {
    const verified = deps.tokens.verify(token, "confirm");
    if (!verified) {
      throw new ApplicationError("UNAUTHORIZED", "유효하지 않은 확인 링크입니다.");
    }
    const updated = await deps.repository.markConfirmed(verified.email, new Date());
    if (!updated) throw notFound("Subscriber");
    return updated;
  },

  async unsubscribe(token: string): Promise<Subscriber> {
    const verified = deps.tokens.verify(token, "unsubscribe");
    if (!verified) {
      throw new ApplicationError("UNAUTHORIZED", "유효하지 않은 해지 링크입니다.");
    }
    const updated = await deps.repository.markUnsubscribed(
      verified.email,
      new Date(),
    );
    if (!updated) throw notFound("Subscriber");
    return updated;
  },

  async listRecent(limit = 200): Promise<Subscriber[]> {
    return deps.repository.listRecent(limit);
  },

  async statusCounts(): Promise<Record<Subscriber["status"], number>> {
    return deps.repository.countByStatus();
  },

  // ── Broadcast ────────────────────────────────────────────────
  async confirmedCount(): Promise<number> {
    const counts = await deps.repository.countByStatus();
    return counts.confirmed;
  },

  async listCampaigns(limit = 50): Promise<Campaign[]> {
    return deps.campaigns.listRecent(limit);
  },

  /** Render + send a one-off test email to a single address (no DB record). */
  async sendTest(rawInput: unknown, to: string): Promise<void> {
    const parsed = campaignInputSchema.safeParse(rawInput);
    if (!parsed.success) throw validationFailed(parsed.error.message);
    if (!to) throw validationFailed("테스트 수신 이메일이 없습니다.");

    const html = await deps.htmlRenderer.render(parsed.data.contentJson);
    const token = deps.tokens.sign({ email: to, purpose: "unsubscribe" });
    await deps.broadcaster.sendBroadcast({
      subject: `[테스트] ${parsed.data.subject}`,
      html,
      recipients: [{ email: to, unsubscribeUrl: deps.buildUnsubscribeUrl(token) }],
    });
  },

  /** Render, persist, and send a campaign to all confirmed subscribers. */
  async broadcast(
    rawInput: unknown,
    createdById: string | null,
  ): Promise<Campaign> {
    const parsed = campaignInputSchema.safeParse(rawInput);
    if (!parsed.success) throw validationFailed(parsed.error.message);

    const emails = await deps.repository.listConfirmedEmails();
    if (emails.length === 0) {
      throw new ApplicationError(
        "VALIDATION_FAILED",
        "확인 완료된 구독자가 없습니다. 발송할 대상이 없어요.",
      );
    }

    const html = await deps.htmlRenderer.render(parsed.data.contentJson);

    const campaign = await deps.campaigns.create({
      subject: parsed.data.subject,
      contentJson: parsed.data.contentJson,
      contentHtml: html,
      status: "sending",
      recipientCount: emails.length,
      createdById,
    });

    try {
      const recipients = emails.map((email) => {
        const token = deps.tokens.sign({ email, purpose: "unsubscribe" });
        return { email, unsubscribeUrl: deps.buildUnsubscribeUrl(token) };
      });
      const { sent } = await deps.broadcaster.sendBroadcast({
        subject: parsed.data.subject,
        html,
        recipients,
      });
      await deps.campaigns.finalize(campaign.id, {
        status: "sent",
        sentCount: sent,
        error: null,
        sentAt: new Date(),
      });
      return { ...campaign, status: "sent", sentCount: sent, sentAt: new Date() };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await deps.campaigns.finalize(campaign.id, {
        status: "failed",
        sentCount: 0,
        error: message.slice(0, 500),
        sentAt: null,
      });
      throw new ApplicationError(
        "INTERNAL",
        `발송 중 오류가 발생했습니다: ${message}`,
      );
    }
  },
});

export type NewsletterService = ReturnType<typeof createNewsletterService>;
