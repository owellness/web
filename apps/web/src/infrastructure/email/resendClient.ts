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

// Default to Resend's shared sender, which works WITHOUT domain verification.
// Note: in this no-domain mode Resend only delivers to the email address that
// owns the Resend account. Set RESEND_FROM to a verified-domain address to
// send to arbitrary recipients (required for the public newsletter).
export const RESEND_FROM =
  process.env.RESEND_FROM ?? "오! 웰니스 <onboarding@resend.dev>";
