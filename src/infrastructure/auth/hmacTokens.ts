import { createHmac, timingSafeEqual } from "node:crypto";

import type { ConfirmTokenSigner } from "@/application/newsletter/ports";

const TOKEN_VERSION = "v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const base64url = (input: Buffer | string) =>
  (typeof input === "string" ? Buffer.from(input, "utf8") : input)
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const base64urlDecode = (input: string): Buffer => {
  const padded = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64");
};

const getSecret = (): string => {
  const secret = process.env.NEWSLETTER_CONFIRM_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "NEWSLETTER_CONFIRM_SECRET (or AUTH_SECRET) is required for newsletter tokens.",
    );
  }
  return secret;
};

const sign = (payload: string, secret: string): string =>
  base64url(createHmac("sha256", secret).update(payload).digest());

export const hmacConfirmTokenSigner: ConfirmTokenSigner = {
  sign({ email, purpose }) {
    const issuedAt = Date.now();
    const payload = `${TOKEN_VERSION}.${purpose}.${email.toLowerCase()}.${issuedAt}`;
    const sig = sign(payload, getSecret());
    return `${base64url(payload)}.${sig}`;
  },

  verify(token, expectedPurpose) {
    try {
      // Email clients can inject whitespace/newlines into long URLs. Strip any
      // stray whitespace before parsing.
      const clean = token.replace(/\s+/g, "");
      const dot = clean.indexOf(".");
      if (dot <= 0 || dot === clean.length - 1) {
        console.warn("[token] malformed (no separator)");
        return null;
      }
      const body = clean.slice(0, dot);
      const sig = clean.slice(dot + 1);
      const decoded = base64urlDecode(body).toString("utf8");
      const expectedSig = sign(decoded, getSecret());
      const sigBuf = Buffer.from(sig);
      const expectedBuf = Buffer.from(expectedSig);
      if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
        console.warn(
          "[token] signature mismatch — likely a different secret (NEWSLETTER_CONFIRM_SECRET/AUTH_SECRET) between send and verify, or a truncated link",
        );
        return null;
      }

      // Parse positionally: version and purpose contain no dots, issuedAt is
      // the trailing number — but the EMAIL can contain dots (e.g.
      // first.last@gmail.com), so we must not naively split on ".".
      const firstDot = decoded.indexOf(".");
      const secondDot = decoded.indexOf(".", firstDot + 1);
      const lastDot = decoded.lastIndexOf(".");
      if (firstDot < 0 || secondDot < 0 || lastDot <= secondDot) {
        console.warn("[token] payload parse failed");
        return null;
      }
      const version = decoded.slice(0, firstDot);
      const purpose = decoded.slice(firstDot + 1, secondDot);
      const email = decoded.slice(secondDot + 1, lastDot);
      const issuedAtStr = decoded.slice(lastDot + 1);

      if (version !== TOKEN_VERSION) {
        console.warn(`[token] version mismatch: ${version}`);
        return null;
      }
      if (purpose !== expectedPurpose) {
        console.warn(`[token] purpose mismatch: ${purpose} != ${expectedPurpose}`);
        return null;
      }
      const issuedAt = Number(issuedAtStr);
      if (!Number.isFinite(issuedAt)) return null;
      if (Date.now() - issuedAt > TTL_MS) {
        console.warn("[token] expired");
        return null;
      }
      return { email };
    } catch (e) {
      console.warn("[token] verify threw:", e);
      return null;
    }
  },
};
