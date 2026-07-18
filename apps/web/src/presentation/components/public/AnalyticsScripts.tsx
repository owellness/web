import Script from "next/script";

/**
 * Loads privacy-friendly analytics without asking the user for consent.
 *
 * Vercel Analytics (mounted in the public layout) is cookie-less and aggregate-
 * only, so it doesn't require consent under PIPA/GDPR.
 *
 * For GA4 we initialize with Google Consent Mode v2 defaults set to "denied"
 * which keeps `_ga`/`_gid` cookies and user-id storage off; only anonymous
 * page-view pings are sent. IP anonymization is also enabled.
 */
export function AnalyticsScripts({ gaId }: { gaId?: string }) {
  if (!gaId) return null;
  return (
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
gtag('consent', 'default', {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted'
});
gtag('config', '${gaId}', {
  anonymize_ip: true,
  client_storage: 'none',
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});`}
      </Script>
    </>
  );
}
