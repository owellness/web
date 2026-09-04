import type {
  ExternalTranslation,
  TranslationCandidate,
} from "@/application/externalContent/model";
import type { ExternalTranslatorPort } from "@/application/externalContent/ports";

const PAPAGO_ENDPOINT =
  "https://papago.apigw.ntruss.com/nmt/v1/translation";
const MAX_TEXT_CHARACTERS = 5_000;
const MAX_CONCURRENT_REQUESTS = 2;
const REQUEST_TIMEOUT_MS = 10_000;
const TRANSLATION_TIMEOUT_MS = 40_000;
const RETRY_DELAY_MS = 200;
const MAX_ATTEMPTS = 2;

type PapagoResponse = {
  message?: {
    result?: {
      translatedText?: unknown;
    };
  };
};

type TranslationSlot = {
  candidateIndex: number;
  field: "title" | "excerpt";
  text: string;
};

class TranslatorRequestError extends Error {
  constructor(
    code: string,
    readonly retryable: boolean,
  ) {
    super(code);
    this.name = "TranslatorRequestError";
  }
}

const credentials = (): { clientId: string; clientSecret: string } => {
  const clientId = process.env.PAPAGO_CLIENT_ID?.trim();
  const clientSecret = process.env.PAPAGO_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("translator_not_configured");
  }
  if (/\r|\n/.test(clientId) || /\r|\n/.test(clientSecret)) {
    throw new Error("translator_invalid_credentials");
  }

  return { clientId, clientSecret };
};

const normalizeSourceText = (value: string): string => {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) throw new Error("translator_invalid_input");
  if (Array.from(text).length > MAX_TEXT_CHARACTERS) {
    throw new Error("translator_text_too_long");
  }
  return text;
};

const assertTranslation = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new TranslatorRequestError("translator_invalid_response", false);
  }
  const text = value.replace(/\s+/g, " ").trim();
  if (!text || /<[^>]+>/.test(text)) {
    throw new TranslatorRequestError("translator_invalid_response", false);
  }
  return text;
};

const httpFailure = (status: number): TranslatorRequestError => {
  if (status === 400) {
    return new TranslatorRequestError("translator_bad_request", false);
  }
  if (status === 401 || status === 403) {
    return new TranslatorRequestError("translator_auth_failed", false);
  }
  if (status === 408 || status === 504) {
    return new TranslatorRequestError("translator_timeout", true);
  }
  if (status === 413) {
    return new TranslatorRequestError("translator_text_too_long", false);
  }
  if (status === 429) {
    return new TranslatorRequestError("translator_quota_exceeded", false);
  }
  if (status === 500 || status === 502 || status === 503) {
    return new TranslatorRequestError(
      "translator_upstream_unavailable",
      true,
    );
  }
  return new TranslatorRequestError(`translator_http_${status}`, false);
};

const requestTranslation = async (
  text: string,
  clientId: string,
  clientSecret: string,
  deadlineSignal: AbortSignal,
): Promise<string> => {
  const controller = new AbortController();
  const abortForDeadline = () => controller.abort();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (deadlineSignal.aborted) controller.abort();
  else {
    deadlineSignal.addEventListener("abort", abortForDeadline, {
      once: true,
    });
  }

  try {
    const response = await fetch(PAPAGO_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret,
      },
      body: JSON.stringify({
        source: "en",
        target: "ko",
        text,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) throw httpFailure(response.status);

    let body: PapagoResponse;
    try {
      body = (await response.json()) as PapagoResponse;
    } catch {
      throw new TranslatorRequestError("translator_invalid_response", false);
    }

    return assertTranslation(body.message?.result?.translatedText);
  } catch (error) {
    if (error instanceof TranslatorRequestError) throw error;
    throw new TranslatorRequestError(
      controller.signal.aborted
        ? "translator_timeout"
        : "translator_network_error",
      true,
    );
  } finally {
    clearTimeout(timeout);
    deadlineSignal.removeEventListener("abort", abortForDeadline);
  }
};

const waitBeforeRetry = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
};

const translateText = async (
  value: string,
  clientId: string,
  clientSecret: string,
  deadlineSignal: AbortSignal,
): Promise<string> => {
  const text = normalizeSourceText(value);
  let lastFailure: TranslatorRequestError | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await requestTranslation(
        text,
        clientId,
        clientSecret,
        deadlineSignal,
      );
    } catch (error) {
      if (!(error instanceof TranslatorRequestError)) throw error;
      lastFailure = error;
      if (!error.retryable || attempt === MAX_ATTEMPTS - 1) throw error;
      await waitBeforeRetry();
    }
  }

  throw lastFailure ?? new Error("translator_failed");
};

export const papagoTranslator: ExternalTranslatorPort = {
  provider: "papago",

  isConfigured() {
    return Boolean(
      process.env.PAPAGO_CLIENT_ID?.trim() &&
        process.env.PAPAGO_CLIENT_SECRET?.trim(),
    );
  },

  async translate(
    candidates: TranslationCandidate[],
  ): Promise<ExternalTranslation[]> {
    if (candidates.length === 0) return [];

    const { clientId, clientSecret } = credentials();
    const slots: TranslationSlot[] = [];
    const results: ExternalTranslation[] = candidates.map((candidate) => ({
      id: candidate.id,
      contentHash: candidate.contentHash,
      translatedTitle: "",
      translatedExcerpt: "",
      provider: "papago",
    }));

    candidates.forEach((candidate, candidateIndex) => {
      slots.push({
        candidateIndex,
        field: "title",
        text: candidate.originalTitle,
      });
      if (candidate.originalExcerpt.trim()) {
        slots.push({
          candidateIndex,
          field: "excerpt",
          text: candidate.originalExcerpt,
        });
      }
    });

    const deadlineController = new AbortController();
    const deadline = setTimeout(
      () => deadlineController.abort(),
      TRANSLATION_TIMEOUT_MS,
    );
    let cursor = 0;

    const worker = async (): Promise<void> => {
      while (true) {
        const slotIndex = cursor;
        cursor += 1;
        const slot = slots[slotIndex];
        if (!slot) return;
        if (deadlineController.signal.aborted) {
          throw new Error("translator_timeout");
        }

        const translated = await translateText(
          slot.text,
          clientId,
          clientSecret,
          deadlineController.signal,
        );
        if (slot.field === "title") {
          results[slot.candidateIndex].translatedTitle = translated;
        } else {
          results[slot.candidateIndex].translatedExcerpt = translated;
        }
      }
    };

    try {
      await Promise.all(
        Array.from(
          { length: Math.min(MAX_CONCURRENT_REQUESTS, slots.length) },
          () => worker(),
        ),
      );
    } catch (error) {
      deadlineController.abort();
      throw error;
    } finally {
      clearTimeout(deadline);
    }

    if (results.some((result) => !result.translatedTitle)) {
      throw new Error("translator_invalid_response");
    }

    return results;
  },
};
