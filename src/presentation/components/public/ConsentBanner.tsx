"use client";

import Script from "next/script";
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "oh-wellness:analytics-consent";

type ConsentValue = "granted" | "denied";

const readConsent = (): ConsentValue | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "granted" || raw === "denied") return raw;
  return null;
};

const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("oh-wellness:consent-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("oh-wellness:consent-change", callback);
  };
};

const writeConsent = (value: ConsentValue) => {
  window.localStorage.setItem(STORAGE_KEY, value);
  window.dispatchEvent(new Event("oh-wellness:consent-change"));
};

export function ConsentBanner({ gaId }: { gaId?: string }) {
  // useSyncExternalStore is the React-recommended way to read browser storage
  // without triggering the set-state-in-effect lint rule and without flashing
  // a hydration mismatch.
  const consent = useSyncExternalStore(
    subscribe,
    readConsent,
    () => null,
  );

  const accept = useCallback(() => writeConsent("granted"), []);
  const decline = useCallback(() => writeConsent("denied"), []);

  return (
    <>
      {/* Load GA4 only when the user has granted consent. */}
      {gaId && consent === "granted" ? (
        <>
          <Script
            id="ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}', { anonymize_ip: true });`}
          </Script>
        </>
      ) : null}

      {consent === null ? (
        <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-card-foreground">
              사이트 개선을 위해 익명 사용 통계(Google Analytics)를 수집할 수 있도록 동의해주세요. 동의는 언제든 거부·해지할 수 있습니다.
            </p>
            <div className="flex gap-2 sm:shrink-0">
              <button
                type="button"
                onClick={decline}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                거부
              </button>
              <button
                type="button"
                onClick={accept}
                className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background transition hover:opacity-90"
              >
                동의
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
