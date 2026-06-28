import { validationFailed } from "@/application/shared/errors";

import {
  DEFAULT_SETTINGS,
  settingsInputSchema,
  type SiteSettings,
} from "./model";
import type { SettingsRepository } from "./ports";

// Empty stored fields fall back to the defaults so the public site never shows
// blanks even if the admin clears a field.
const withDefaults = (s: SiteSettings | null): SiteSettings => ({
  heroEyebrow: s?.heroEyebrow?.trim()
    ? s.heroEyebrow
    : DEFAULT_SETTINGS.heroEyebrow,
  heroTitle: s?.heroTitle?.trim() ? s.heroTitle : DEFAULT_SETTINGS.heroTitle,
  heroSubtitle: s?.heroSubtitle?.trim()
    ? s.heroSubtitle
    : DEFAULT_SETTINGS.heroSubtitle,
  faviconUrl: s?.faviconUrl ?? null,
  ogImageUrl: s?.ogImageUrl ?? null,
});

export const createSettingsService = (repo: SettingsRepository) => ({
  /** Public read — always returns a fully-populated settings object. */
  async get(): Promise<SiteSettings> {
    const row = await repo.get();
    return withDefaults(row);
  },

  /** Admin read — returns raw stored values (so cleared fields show empty). */
  async getRaw(): Promise<SiteSettings> {
    const row = await repo.get();
    return row ?? { ...DEFAULT_SETTINGS };
  },

  async update(rawInput: unknown): Promise<SiteSettings> {
    const parsed = settingsInputSchema.safeParse(rawInput);
    if (!parsed.success) throw validationFailed(parsed.error.message);
    return repo.upsert({
      heroEyebrow: parsed.data.heroEyebrow,
      heroTitle: parsed.data.heroTitle,
      heroSubtitle: parsed.data.heroSubtitle,
      faviconUrl: parsed.data.faviconUrl ?? null,
      ogImageUrl: parsed.data.ogImageUrl ?? null,
    });
  },
});

export type SettingsService = ReturnType<typeof createSettingsService>;
