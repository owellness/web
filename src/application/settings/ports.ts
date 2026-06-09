import type { SiteSettings } from "./model";

export interface SettingsRepository {
  get(): Promise<SiteSettings | null>;
  upsert(input: SiteSettings): Promise<SiteSettings>;
}
