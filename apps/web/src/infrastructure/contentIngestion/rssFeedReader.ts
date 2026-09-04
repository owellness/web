import { createHash } from "node:crypto";

import sanitizeHtml from "sanitize-html";

import type {
  ExternalFeedItem,
  ExternalFeedResult,
  ExternalFeedSource,
  ExternalFeedState,
} from "@/application/externalContent/model";
import type { ExternalFeedReaderPort } from "@/application/externalContent/ports";

const MAX_FEED_BYTES = 1_500_000;
const MAX_REDIRECTS = 3;
const MAX_ITEMS_PER_SOURCE = 10;
const MAX_BODY_CHARACTERS = 24_000;
const REQUEST_TIMEOUT_MS = 12_000;
const EXTRACTION_VERSION = "rss-body-v1";

const unwrap = (value: string): string => {
  const trimmed = value.trim();
  const cdata = trimmed.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i);
  return cdata ? cdata[1] : trimmed;
};

const element = (xml: string, name: string): string => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(
    new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i"),
  );
  return match ? unwrap(match[1]) : "";
};

const decodeXmlEntities = (value: string): string =>
  value
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (match, encoded: string) => {
      const hexadecimal = encoded[0]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(
        hexadecimal ? encoded.slice(1) : encoded,
        hexadecimal ? 16 : 10,
      );
      if (
        !Number.isInteger(codePoint) ||
        codePoint < 0 ||
        codePoint > 0x10ffff ||
        (codePoint >= 0xd800 && codePoint <= 0xdfff)
      ) {
        return match;
      }
      return String.fromCodePoint(codePoint);
    })
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/gi, (match, name: string) => {
      const entities: Record<string, string> = {
        amp: "&",
        apos: "'",
        gt: ">",
        lt: "<",
        nbsp: " ",
        quot: '"',
      };
      return entities[name.toLowerCase()] ?? match;
    });

const plainText = (html: string): string =>
  decodeXmlEntities(
    sanitizeHtml(decodeXmlEntities(html), {
      allowedTags: [],
      allowedAttributes: {},
    }),
  )
    .replace(/\s*The post\s+[\s\S]+?\s+appeared first on\s+[\s\S]+?\.?$/i, "")
    .replace(/\s+/g, " ")
    .trim();

const bodyText = (html: string): string => {
  if (!html.trim()) return "";

  const sanitized = sanitizeHtml(decodeXmlEntities(html), {
    allowedTags: [
      "p",
      "br",
      "div",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "li",
      "blockquote",
      "pre",
      "tr",
      "figure",
    ],
    allowedAttributes: {},
  })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li(?:\s[^>]*)?>/gi, "\n• ")
    .replace(
      /<\/(?:p|div|h[1-6]|li|blockquote|pre|tr|figure)>/gi,
      "\n\n",
    )
    .replace(/<[^>]+>/g, "");

  const text = decodeXmlEntities(sanitized)
    .replace(/\u00a0/g, " ")
    .split(/\n+/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(
      /\s*The post\s+[\s\S]+?\s+appeared first on\s+[\s\S]+?\.?$/i,
      "",
    )
    .trim();

  return truncate(text, MAX_BODY_CHARACTERS);
};

const truncate = (value: string, maxLength: number): string => {
  const characters = Array.from(value);
  if (characters.length <= maxLength) return value;
  const contentLimit = Math.max(0, maxLength - 1);
  const slice = characters.slice(0, contentLimit + 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cutAt = lastSpace > contentLimit * 0.7 ? lastSpace : contentLimit;
  return `${slice.slice(0, cutAt).join("").trim()}…`;
};

const assertAllowedUrl = (
  value: string,
  source: ExternalFeedSource,
): URL => {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    (url.port !== "" && url.port !== "443") ||
    !source.allowedHosts.includes(url.hostname.toLowerCase())
  ) {
    throw new Error("feed_url_not_allowed");
  }
  return url;
};

const normalizeArticleUrl = (
  value: string,
  source: ExternalFeedSource,
): string => {
  const url = assertAllowedUrl(value, source);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  return url.toString();
};

export const parseRssFeed = (
  source: ExternalFeedSource,
  xml: string,
): ExternalFeedItem[] => {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("feed_unsafe_xml");

  const blocks = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [];
  const items: ExternalFeedItem[] = [];

  for (const block of blocks.slice(0, MAX_ITEMS_PER_SOURCE)) {
    try {
      const originalTitle = truncate(plainText(element(block, "title")), 480);
      const rawUrl = decodeXmlEntities(plainText(element(block, "link")));
      const sourceUrl = normalizeArticleUrl(rawUrl, source);
      const guid = plainText(element(block, "guid"));
      const originalExcerpt = truncate(
        plainText(element(block, "description")),
        700,
      );
      const originalBody = source.translationAllowed
        ? bodyText(element(block, "content:encoded"))
        : "";
      const author = truncate(plainText(element(block, "dc:creator")), 200);
      const published = new Date(plainText(element(block, "pubDate")));

      if (!originalTitle || !sourceUrl || Number.isNaN(published.getTime())) {
        continue;
      }

      const contentHash = createHash("sha256")
        .update(
          `${EXTRACTION_VERSION}\n${originalTitle}\n${originalExcerpt}\n${originalBody}\n${published.toISOString()}`,
        )
        .digest("hex");

      items.push({
        externalId: truncate(guid || sourceUrl, 500),
        sourceUrl,
        originalTitle,
        originalExcerpt,
        originalBody,
        sourceAuthor: author || null,
        sourcePublishedAt: published,
        contentHash,
      });
    } catch {
      // A malformed item should not suppress the other valid entries in a
      // source-owned feed. If every item is invalid, the guard below fails it.
      continue;
    }
  }

  if (blocks.length > 0 && items.length === 0) {
    throw new Error("feed_no_valid_items");
  }

  return items;
};

const fetchFeed = async (
  source: ExternalFeedSource,
  state: ExternalFeedState | null,
): Promise<Response> => {
  let url = assertAllowedUrl(source.feedUrl, source);
  const deadline = Date.now() + REQUEST_TIMEOUT_MS;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const headers = new Headers({
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9",
      "User-Agent": "OWellnessFeedBot/1.0 (+https://www.owellness.co.kr)",
    });
    if (state?.etag) headers.set("If-None-Match", state.etag);
    if (state?.lastModified) {
      headers.set("If-Modified-Since", state.lastModified);
    }

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) throw new Error("feed_timeout");
    const signal = AbortSignal.timeout(remainingMs);
    let response: Response;
    try {
      response = await fetch(url, {
        headers,
        redirect: "manual",
        cache: "no-store",
        signal,
      });
    } catch (error) {
      if (signal.aborted) throw new Error("feed_timeout");
      throw error;
    }

    if (response.status === 304) return response;

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirects === MAX_REDIRECTS) {
        throw new Error("feed_redirect_rejected");
      }
      url = assertAllowedUrl(new URL(location, url).toString(), source);
      continue;
    }

    return response;
  }

  throw new Error("feed_redirect_rejected");
};

const readLimitedText = async (response: Response): Promise<string> => {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_FEED_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new Error("feed_too_large");
    }
    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
};

export const rssFeedReader: ExternalFeedReaderPort = {
  async fetch(source, state): Promise<ExternalFeedResult> {
    const response = await fetchFeed(source, state);
    const etag = response.headers.get("etag");
    const lastModified = response.headers.get("last-modified");

    if (response.status === 304) {
      return { kind: "not-modified", etag, lastModified };
    }
    if (!response.ok) throw new Error(`feed_http_${response.status}`);

    const contentType = response.headers.get("content-type") ?? "";
    if (!/(?:rss|atom|xml)/i.test(contentType)) {
      throw new Error("feed_invalid_content_type");
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_FEED_BYTES) throw new Error("feed_too_large");

    const xml = await readLimitedText(response);

    return {
      kind: "items",
      etag,
      lastModified,
      items: parseRssFeed(source, xml),
    };
  },
};
