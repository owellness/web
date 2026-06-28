// Social platforms offered in the author profile editor.
//
// Kept free of any server-only dependency (no zod, no DB) so it can be imported
// by both the Server Action and the client-side profile form without pulling
// the validation layer into the browser bundle. Keys are stored verbatim in
// `authors.social_json` and emitted as `sameAs` entries in the Person JSON-LD.

export const SOCIAL_PLATFORMS = [
  { key: "twitter", label: "X (트위터)", placeholder: "https://x.com/계정명" },
  {
    key: "instagram",
    label: "인스타그램",
    placeholder: "https://instagram.com/계정명",
  },
  { key: "youtube", label: "유튜브", placeholder: "https://youtube.com/@채널명" },
  {
    key: "facebook",
    label: "페이스북",
    placeholder: "https://facebook.com/페이지명",
  },
  {
    key: "linkedin",
    label: "링크드인",
    placeholder: "https://linkedin.com/in/계정명",
  },
] as const;

export type SocialPlatformKey = (typeof SOCIAL_PLATFORMS)[number]["key"];
