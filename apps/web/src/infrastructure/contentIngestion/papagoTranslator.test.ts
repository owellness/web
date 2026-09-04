import assert from "node:assert/strict";
import { test } from "node:test";

import type { TranslationCandidate } from "@/application/externalContent/model";

import { papagoTranslator } from "./papagoTranslator";

const candidate = (
  id: string,
  originalExcerpt: string,
): TranslationCandidate => ({
  id,
  sourceKey: "nutritionfacts",
  externalId: `external-${id}`,
  sourceUrl: `https://nutritionfacts.org/blog/${id}/`,
  originalTitle: `Title ${id}`,
  originalExcerpt,
  sourceAuthor: null,
  sourcePublishedAt: new Date("2026-09-01T00:00:00Z"),
  contentHash: id.repeat(64).slice(0, 64),
});

const preserveEnvironment = () => {
  const clientId = process.env.PAPAGO_CLIENT_ID;
  const clientSecret = process.env.PAPAGO_CLIENT_SECRET;

  return () => {
    if (clientId === undefined) delete process.env.PAPAGO_CLIENT_ID;
    else process.env.PAPAGO_CLIENT_ID = clientId;
    if (clientSecret === undefined) delete process.env.PAPAGO_CLIENT_SECRET;
    else process.env.PAPAGO_CLIENT_SECRET = clientSecret;
  };
};

const configureTestCredentials = () => {
  process.env.PAPAGO_CLIENT_ID = "test-client-id";
  process.env.PAPAGO_CLIENT_SECRET = "test-client-secret";
};

test("configuration requires both Papago credentials", async () => {
  const restoreEnvironment = preserveEnvironment();
  const originalFetch = globalThis.fetch;
  let called = false;

  try {
    delete process.env.PAPAGO_CLIENT_ID;
    delete process.env.PAPAGO_CLIENT_SECRET;
    globalThis.fetch = (async () => {
      called = true;
      throw new Error("fetch_must_not_run");
    }) as typeof fetch;

    assert.equal(papagoTranslator.isConfigured(), false);
    process.env.PAPAGO_CLIENT_ID = "test-client-id";
    assert.equal(papagoTranslator.isConfigured(), false);
    process.env.PAPAGO_CLIENT_SECRET = "test-client-secret";
    assert.equal(papagoTranslator.isConfigured(), true);
    assert.deepEqual(await papagoTranslator.translate([]), []);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvironment();
  }
});

test("titles and non-empty excerpts use the official Papago request shape", async () => {
  const restoreEnvironment = preserveEnvironment();
  const originalFetch = globalThis.fetch;
  const requests: Array<{
    url: string;
    method: string | undefined;
    clientId: string | null;
    clientSecret: string | null;
    body: { source: string; target: string; text: string };
  }> = [];

  try {
    configureTestCredentials();
    globalThis.fetch = (async (input, init) => {
      const body = JSON.parse(String(init?.body)) as {
        source: string;
        target: string;
        text: string;
      };
      const headers = new Headers(init?.headers);
      requests.push({
        url: String(input),
        method: init?.method,
        clientId: headers.get("X-NCP-APIGW-API-KEY-ID"),
        clientSecret: headers.get("X-NCP-APIGW-API-KEY"),
        body,
      });

      return Response.json({
        message: {
          result: {
            translatedText: `  번역 ${body.text}  `,
          },
        },
      });
    }) as typeof fetch;

    const results = await papagoTranslator.translate([
      candidate("a", "Excerpt a"),
      candidate("b", ""),
    ]);

    assert.equal(requests.length, 3);
    assert.deepEqual(
      requests.map((request) => request.body.text).sort(),
      ["Excerpt a", "Title a", "Title b"],
    );
    for (const request of requests) {
      assert.equal(
        request.url,
        "https://papago.apigw.ntruss.com/nmt/v1/translation",
      );
      assert.equal(request.method, "POST");
      assert.equal(request.clientId, "test-client-id");
      assert.equal(request.clientSecret, "test-client-secret");
      assert.equal(request.body.source, "en");
      assert.equal(request.body.target, "ko");
    }
    assert.deepEqual(results, [
      {
        id: "a",
        contentHash: "a".repeat(64),
        translatedTitle: "번역 Title a",
        translatedExcerpt: "번역 Excerpt a",
        provider: "papago",
      },
      {
        id: "b",
        contentHash: "b".repeat(64),
        translatedTitle: "번역 Title b",
        translatedExcerpt: "",
        provider: "papago",
      },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvironment();
  }
});

test("transient upstream failures are retried once", async () => {
  const restoreEnvironment = preserveEnvironment();
  const originalFetch = globalThis.fetch;
  let calls = 0;

  try {
    configureTestCredentials();
    globalThis.fetch = (async () => {
      calls += 1;
      if (calls === 1) return new Response(null, { status: 503 });
      return Response.json({
        message: { result: { translatedText: "번역 제목" } },
      });
    }) as typeof fetch;

    const [result] = await papagoTranslator.translate([candidate("c", "")]);

    assert.equal(calls, 2);
    assert.equal(result?.translatedTitle, "번역 제목");
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvironment();
  }
});

test("authentication failures expose only a stable internal error code", async () => {
  const restoreEnvironment = preserveEnvironment();
  const originalFetch = globalThis.fetch;

  try {
    configureTestCredentials();
    globalThis.fetch = (async () =>
      Response.json(
        { error: { message: "upstream-sensitive-response" } },
        { status: 401 },
      )) as typeof fetch;

    await assert.rejects(
      () => papagoTranslator.translate([candidate("d", "")]),
      (error: unknown) =>
        error instanceof Error && error.message === "translator_auth_failed",
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvironment();
  }
});

test("oversized input and unsafe translated HTML are rejected", async () => {
  const restoreEnvironment = preserveEnvironment();
  const originalFetch = globalThis.fetch;
  let calls = 0;

  try {
    configureTestCredentials();
    const oversized = candidate("e", "");
    oversized.originalTitle = "a".repeat(5_001);
    globalThis.fetch = (async () => {
      calls += 1;
      return Response.json({
        message: {
          result: { translatedText: "<script>unsafe</script>" },
        },
      });
    }) as typeof fetch;

    await assert.rejects(
      () => papagoTranslator.translate([oversized]),
      /translator_text_too_long/,
    );
    assert.equal(calls, 0);

    await assert.rejects(
      () => papagoTranslator.translate([candidate("f", "")]),
      /translator_invalid_response/,
    );
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvironment();
  }
});
