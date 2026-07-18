import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "./model";
import type { MediaUploadPort } from "./ports";

export type MediaUploadRequest = {
  body: unknown;
  request: Request;
  authorizeUpload: () => Promise<boolean>;
};

export const createMediaService = (port: MediaUploadPort) => ({
  /** Drives the Vercel Blob client-upload handshake with our policy applied. */
  async handleUpload({ body, request, authorizeUpload }: MediaUploadRequest) {
    return port.handleClientUpload({
      body,
      request,
      authorizeUpload,
      allowedContentTypes: ALLOWED_IMAGE_TYPES,
      maxSizeBytes: MAX_IMAGE_BYTES,
    });
  },
});

export type MediaService = ReturnType<typeof createMediaService>;
