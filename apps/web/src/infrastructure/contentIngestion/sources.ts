import type { ExternalFeedSource } from "@/application/externalContent/model";

const allowedTranslations = new Set(
  (process.env.EXTERNAL_TRANSLATION_ALLOWED_SOURCES ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

const canTranslate = (key: string): boolean =>
  allowedTranslations.has(key);

export const externalFeedSources: readonly ExternalFeedSource[] = [
  {
    key: "nutritionfacts",
    name: "NutritionFacts.org",
    homepageUrl: "https://nutritionfacts.org/blog/",
    feedUrl: "https://nutritionfacts.org/blog/feed/",
    allowedHosts: ["nutritionfacts.org", "www.nutritionfacts.org"],
    translationAllowed: canTranslate("nutritionfacts"),
  },
  {
    key: "gowinglife",
    name: "Gowing Life",
    homepageUrl: "https://www.gowinglife.com/",
    feedUrl: "https://www.gowinglife.com/feed/",
    allowedHosts: ["gowinglife.com", "www.gowinglife.com"],
    translationAllowed: canTranslate("gowinglife"),
  },
  {
    key: "gwi",
    name: "Global Wellness Institute",
    homepageUrl: "https://globalwellnessinstitute.org/global-wellness-institute-blog/",
    feedUrl: "https://globalwellnessinstitute.org/feed/",
    allowedHosts: ["globalwellnessinstitute.org"],
    translationAllowed: canTranslate("gwi"),
  },
];
