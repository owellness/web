import { upload } from "@vercel/blob/client";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_BYTES = 10 * 1024 * 1024;

export type UploadResult = { url: string };

/**
 * Uploads an image directly to Vercel Blob via our /api/admin/upload token
 * handshake. Returns the public URL. Throws with a Korean message on failure.
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("지원하지 않는 이미지 형식입니다 (JPEG·PNG·WebP·GIF·AVIF).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("이미지 용량은 10MB 이하만 업로드할 수 있습니다.");
  }

  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/admin/upload",
    contentType: file.type,
  });

  return { url: blob.url };
}
