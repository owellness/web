import { z } from "zod";

export type SiteSettings = {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  faviconUrl: string | null;
};

// Defaults mirror the original hard-coded home hero, used until an admin edits
// them (or when the DB is unavailable, e.g. during build).
export const DEFAULT_SETTINGS: SiteSettings = {
  heroEyebrow: "Evidence-based wellness",
  heroTitle: "잘 자고, 잘 먹고, 잘 움직이는 법.\n오 웰니스가 매주 정리합니다.",
  heroSubtitle:
    "수면, 영양, 운동, 여성 건강. 흩어진 웰니스 정보를 근거와 함께 한곳에서 만나보세요. 곧 출시될 오 웰니스 앱의 진단·코칭 기능을 가장 먼저 받아볼 수 있도록 뉴스레터를 보내드립니다.",
  faviconUrl: null,
};

export const settingsInputSchema = z.object({
  heroEyebrow: z.string().max(120).default(""),
  heroTitle: z.string().max(400).default(""),
  heroSubtitle: z.string().max(1500).default(""),
  faviconUrl: z.string().url().nullable().optional(),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;
