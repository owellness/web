import type { DomainKey } from "./model";

// Maps each wellness domain to the site's content category slugs whose articles
// best support growth in that domain. These are the seeded default slugs; the
// result page intersects them with the categories that actually exist at
// runtime, so a removed/renamed category simply drops out gracefully.
export const DOMAIN_CATEGORY_SLUGS: Readonly<
  Record<DomainKey, readonly string[]>
> = {
  // 도전·탐구·목표 — building new habits leans on movement & nutrition content.
  action: ["fitness", "nutrition"],
  // 신체 활동·영양·수면.
  fitness: ["fitness", "nutrition", "sleep"],
  // 스트레스 회복·태도·휴식 → the sleep/stress/mental-health hub.
  calm: ["sleep"],
  // 목적·관계·에너지 → mental-health content is the closest fit.
  heart: ["sleep"],
};
