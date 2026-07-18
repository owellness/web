import type { SitePage } from "./model";

export type SitePageUpsert = {
  slug: string;
  title: string;
  bodyHtml: string;
  bodyJson: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
};

export interface SitePageRepository {
  listAll(): Promise<SitePage[]>;
  findBySlug(slug: string): Promise<SitePage | null>;
  upsert(input: SitePageUpsert): Promise<SitePage>;
}
