import { cache } from "react";

import { settingsService } from "@/composition";
import { SITE_CONFIG } from "@/config/site";

/**
 * Per-request memoized read of the public site settings. A single page request
 * runs both the root layout's `generateMetadata` (favicon + OG image) and the
 * matched route's own `generateMetadata`; caching here collapses what would
 * otherwise be duplicate DB reads into one.
 *
 * Server-only: imported solely from server components' metadata. Returns null
 * (rather than throwing) when the DB is unavailable, e.g. during build.
 */
export const getSiteSettings = cache(() =>
  settingsService.get().catch(() => null),
);

/**
 * The site-wide default Open Graph (social share) image: the admin-uploaded
 * image from site settings when set, otherwise the bundled static default.
 * Pages with a purpose-built OG image (per-article `ogImageUrl`, OWTI results)
 * supply their own and don't use this.
 */
export async function resolveDefaultOgImage(): Promise<string> {
  const settings = await getSiteSettings();
  return settings?.ogImageUrl ?? SITE_CONFIG.defaultOgImage;
}
