import type {
  ExternalTranslation,
  TranslationCandidate,
} from "@/application/externalContent/model";
import type { ExternalTranslatorPort } from "@/application/externalContent/ports";

const PAPAGO_ENDPOINT =
  "https://papago.apigw.ntruss.com/nmt/v1/translation";
const MAX_TEXT_CHARACTERS = 5_000;
const MAX_BODY_CHARACTERS = 24_000;
const BODY_CHUNK_CHARACTERS = 4_500;
const MAX_CONCURRENT_REQUESTS = 2;
const REQUEST_TIMEOUT_MS = 10_000;
const TRANSLATION_TIMEOUT_MS = 40_000;
const RETRY_DELAY_MS = 200;
const MAX_ATTEMPTS = 2;
const HTML_TAG_PATTERN = /<\/?[a-z][a-z0-9-]*(?:\s[^<>]*|\/?)>/i;

type PapagoResponse = {
  message?: {
    result?: {
      translatedText?: unknown;
    };
  };
};

type TranslationSlot = {
  candidateIndex: number;
  field: "title" | "excerpt" | "body";
  chunkIndex?: number;
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

const normalizeParagraphs = (value: string): string =>
  value
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");

const normalizeSourceText = (
  value: string,
  preserveParagraphs = false,
): string => {
  const text = preserveParagraphs
    ? normalizeParagraphs(value)
    : value.replace(/\s+/g, " ").trim();
  if (!text) throw new Error("translator_invalid_input");
  if (Array.from(text).length > MAX_TEXT_CHARACTERS) {
    throw new Error("translator_text_too_long");
  }
  return text;
};

const assertTranslation = (
  value: unknown,
  preserveParagraphs = false,
): string => {
  if (typeof value !== "string") {
    throw new TranslatorRequestError("translator_invalid_response", false);
  }
  const text = preserveParagraphs
    ? normalizeParagraphs(value)
    : value.replace(/\s+/g, " ").trim();
  if (!text || HTML_TAG_PATTERN.test(text)) {
    throw new TranslatorRequestError("translator_invalid_response", false);
  }
  return text;
};

const splitBodyForTranslation = (value: string): string[] => {
  const normalized = normalizeParagraphs(value);
  const characters = Array.from(normalized);
  if (characters.length > MAX_BODY_CHARACTERS) {
    throw new Error("translator_body_too_long");
  }
  if (characters.length <= BODY_CHUNK_CHARACTERS) {
    return normalized ? [normalized] : [];
  }

  const chunks: string[] = [];
  let remaining = characters;
  while (remaining.length > BODY_CHUNK_CHARACTERS) {
    const minimumBoundary = Math.floor(BODY_CHUNK_CHARACTERS * 0.6);
    let cutAt = BODY_CHUNK_CHARACTERS;

    for (let index = BODY_CHUNK_CHARACTERS; index >= minimumBoundary; index -= 1) {
      if (remaining[index - 1] === "\n" && remaining[index] === "\n") {
        cutAt = index - 1;
        break;
      }
      if (
        remaining[index] === " " &&
        /[.!?]/.test(remaining[index - 1] ?? "")
      ) {
        cutAt = index;
        break;
      }
      if (cutAt === BODY_CHUNK_CHARACTERS && remaining[index] === " ") {
        cutAt = index;
      }
    }

    const chunk = remaining.slice(0, cutAt).join("").trim();
    if (chunk) chunks.push(chunk);
    remaining = remaining.slice(cutAt);
    while (remaining[0] === " " || remaining[0] === "\n") {
      remaining = remaining.slice(1);
    }
  }

  const tail = remaining.join("").trim();
  if (tail) chunks.push(tail);
  return chunks;
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
  preserveParagraphs = false,
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

    return assertTranslation(
      body.message?.result?.translatedText,
      preserveParagraphs,
    );
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
  preserveParagraphs = false,
): Promise<string> => {
  const text = normalizeSourceText(value, preserveParagraphs);
  let lastFailure: TranslatorRequestError | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await requestTranslation(
        text,
        clientId,
        clientSecret,
        deadlineSignal,
        preserveParagraphs,
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
    options?: { signal?: AbortSignal },
  ): Promise<ExternalTranslation[]> {
    if (candidates.length === 0) return [];

    const { clientId, clientSecret } = credentials();
    const slots: TranslationSlot[] = [];
    const results: ExternalTranslation[] = candidates.map((candidate) => ({
      id: candidate.id,
      contentHash: candidate.contentHash,
      translatedTitle: "",
      translatedExcerpt: "",
      translatedBody: "",
      provider: "papago",
    }));
    const bodyChunks: string[][] = candidates.map(() => []);

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
      splitBodyForTranslation(candidate.originalBody).forEach(
        (text, chunkIndex) => {
          slots.push({
            candidateIndex,
            field: "body",
            chunkIndex,
            text,
          });
        },
      );
    });

    const deadlineController = new AbortController();
    const abortForCaller = () => deadlineController.abort();
    if (options?.signal?.aborted) deadlineController.abort();
    else {
      options?.signal?.addEventListener("abort", abortForCaller, {
        once: true,
      });
    }
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
          slot.field === "body",
        );
        if (slot.field === "title") {
          results[slot.candidateIndex].translatedTitle = translated;
        } else if (slot.field === "excerpt") {
          results[slot.candidateIndex].translatedExcerpt = translated;
        } else {
          bodyChunks[slot.candidateIndex][slot.chunkIndex ?? 0] = translated;
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
      options?.signal?.removeEventListener("abort", abortForCaller);
    }

    if (results.some((result) => !result.translatedTitle)) {
      throw new Error("translator_invalid_response");
    }

    candidates.forEach((candidate, index) => {
      results[index].translatedBody = bodyChunks[index].join("\n\n");
      if (candidate.originalBody.trim() && !results[index].translatedBody) {
        throw new Error("translator_invalid_response");
      }
    });

    return results;
  },
};
