import { Resend } from "resend";

let cached: Resend | null = null;

const getResend = (): Resend => {
  if (cached) return cached;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to send email.");
  }
  cached = new Resend(apiKey);
  return cached;
};

// Lazy proxy: importing `resend` has no side effects until first use.
export const resend = new Proxy({} as Resend, {
  get: (_target, prop, receiver) => Reflect.get(getResend(), prop, receiver),
});

export const RESEND_FROM =
  process.env.RESEND_FROM ?? "오 웰니스 <noreply@example.com>";
