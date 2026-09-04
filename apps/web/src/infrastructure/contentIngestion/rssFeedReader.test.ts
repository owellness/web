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
  translationAllowed: true,
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
        <title><![CDATA[<b>Useful &amp; practical title</b>]]></title>
        <link>https://example.com/useful?utm_source=rss&amp;a=1#top</link>
        <guid>useful-1</guid>
        <description><![CDATA[<p>Short <strong>introduction</strong>.</p>]]></description>
        <content:encoded><![CDATA[
          <h2>Section heading</h2>
          <p>First &amp; second paragraph with <strong>emphasis</strong>.</p>
          <script>alert("unsafe")</script>
          <ul><li>Useful point</li></ul>
        ]]></content:encoded>
        <dc:creator>Writer</dc:creator>
        <pubDate>Tue, 01 Sep 2026 00:00:00 GMT</pubDate>
      </item>
    </channel></rss>`;

  const items = parseRssFeed(source, xml);

  assert.equal(items.length, 1);
  assert.equal(items[0]?.originalTitle, "Useful & practical title");
  assert.equal(items[0]?.originalExcerpt, "Short introduction.");
  assert.equal(
    items[0]?.originalBody,
    "Section heading\n\nFirst & second paragraph with emphasis.\n\n• Useful point",
  );
  assert.equal(items[0]?.sourceUrl, "https://example.com/useful?a=1");
});

test("RSS body text is not retained while translation permission is disabled", () => {
  const [item] = parseRssFeed(
    { ...source, translationAllowed: false },
    `<rss><channel><item>
      <title>Summary only</title>
      <link>https://example.com/summary-only</link>
      <description>Summary</description>
      <content:encoded><![CDATA[<p>Full body</p>]]></content:encoded>
      <pubDate>Tue, 01 Sep 2026 00:00:00 GMT</pubDate>
    </item></channel></rss>`,
  );

  assert.equal(item?.originalBody, "");
});

test("RSS body text is capped within the translation budget", () => {
  const [item] = parseRssFeed(
    source,
    `<rss><channel><item>
      <title>Long body</title>
      <link>https://example.com/long-body</link>
      <content:encoded><![CDATA[<p>${"a".repeat(25_000)}</p>]]></content:encoded>
      <pubDate>Tue, 01 Sep 2026 00:00:00 GMT</pubDate>
    </item></channel></rss>`,
  );

  assert.equal(Array.from(item?.originalBody ?? "").length, 24_000);
  assert.ok(item?.originalBody.endsWith("…"));
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
