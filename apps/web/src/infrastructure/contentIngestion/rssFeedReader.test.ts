import assert from "node:assert/strict";
import { test } from "node:test";

import type { ExternalFeedSource } from "@/application/externalContent/model";

import { parseRssFeed, rssFeedReader } from "./rssFeedReader";

const source: ExternalFeedSource = {
  key: "gowinglife",
  name: "Example",
  homepageUrl: "https://example.com/",
  feedUrl: "https://example.com/feed/",
  allowedHosts: ["example.com"],
  translationAllowed: false,
};

test("a malformed item is skipped while valid RSS entries are sanitized", () => {
  const xml = `<?xml version="1.0"?>
    <rss><channel>
      <item>
        <title>Rejected URL</title>
        <link>http://malicious.example/post</link>
        <pubDate>Tue, 01 Sep 2026 00:00:00 GMT</pubDate>
      </item>
      <item>
        <title><![CDATA[<b>Useful title</b>]]></title>
        <link>https://example.com/useful?utm_source=rss&amp;a=1#top</link>
        <guid>useful-1</guid>
        <description><![CDATA[<p>Short <strong>introduction</strong>.</p>]]></description>
        <dc:creator>Writer</dc:creator>
        <pubDate>Tue, 01 Sep 2026 00:00:00 GMT</pubDate>
      </item>
    </channel></rss>`;

  const items = parseRssFeed(source, xml);

  assert.equal(items.length, 1);
  assert.equal(items[0]?.originalTitle, "Useful title");
  assert.equal(items[0]?.originalExcerpt, "Short introduction.");
  assert.equal(items[0]?.sourceUrl, "https://example.com/useful?a=1");
});

test("unsafe XML declarations are rejected before item parsing", () => {
  assert.throws(
    () =>
      parseRssFeed(
        source,
        '<!DOCTYPE rss [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><rss />',
      ),
    /feed_unsafe_xml/,
  );
});

test("chunked feeds are cancelled as soon as the byte limit is exceeded", async () => {
  const originalFetch = globalThis.fetch;
  let cancelled = false;
  let emitted = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      emitted += 1;
      controller.enqueue(new Uint8Array(800_000));
      if (emitted === 5) controller.close();
    },
    cancel() {
      cancelled = true;
    },
  });

  globalThis.fetch = (async () =>
    new Response(stream, {
      headers: { "content-type": "application/rss+xml" },
    })) as typeof fetch;

  try {
    await assert.rejects(
      () => rssFeedReader.fetch(source, null),
      /feed_too_large/,
    );
    assert.equal(cancelled, true);
    assert.ok(emitted < 5);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
