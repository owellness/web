export type Author = {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  credentials: string | null;
  affiliation: string | null;
  websiteUrl: string | null;
  social: Record<string, string>;
};
