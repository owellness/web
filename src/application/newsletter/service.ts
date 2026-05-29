import {
  ApplicationError,
  notFound,
  validationFailed,
} from "@/application/shared/errors";
import {
  subscribeInputSchema,
  type Subscriber,
  type SubscribeInput,
} from "./model";
import type {
  ConfirmTokenSigner,
  NewsletterMailer,
  SubscriberRepository,
} from "./ports";

export type NewsletterServiceDeps = {
  repository: SubscriberRepository;
  mailer: NewsletterMailer;
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
});

export type NewsletterService = ReturnType<typeof createNewsletterService>;
