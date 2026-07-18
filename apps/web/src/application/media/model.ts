export type UploadedMedia = {
  url: string;
  pathname: string;
  contentType: string;
};

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

// Vercel Blob client upload streams directly to storage, so we can allow
// larger files than the 4.5MB serverless body limit.
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
