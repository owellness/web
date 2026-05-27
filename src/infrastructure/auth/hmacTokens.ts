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
      const [body, sig] = token.split(".");
      if (!body || !sig) return null;
      const decoded = base64urlDecode(body).toString("utf8");
      const expectedSig = sign(decoded, getSecret());
      const sigBuf = Buffer.from(sig);
      const expectedBuf = Buffer.from(expectedSig);
      if (sigBuf.length !== expectedBuf.length) return null;
      if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

      const [version, purpose, email, issuedAtStr] = decoded.split(".");
      if (version !== TOKEN_VERSION) return null;
      if (purpose !== expectedPurpose) return null;
      const issuedAt = Number(issuedAtStr);
      if (!Number.isFinite(issuedAt)) return null;
      if (Date.now() - issuedAt > TTL_MS) return null;
      return { email };
    } catch {
      return null;
    }
  },
};
