import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";

import type { MediaUploadPort } from "@/application/media/ports";

export const blobMediaUploadAdapter: MediaUploadPort = {
  async handleClientUpload({
    body,
    request,
    authorizeUpload,
    allowedContentTypes,
    maxSizeBytes,
  }) {
    return handleUpload({
      body: body as HandleUploadBody,
      request,
      onBeforeGenerateToken: async () => {
        const allowed = await authorizeUpload();
        if (!allowed) {
          throw new Error("Unauthorized upload");
        }
        return {
          allowedContentTypes: [...allowedContentTypes],
          maximumSizeInBytes: maxSizeBytes,
          addRandomSuffix: true,
        };
      },
      // Fired server-to-server by Vercel Blob after the upload finishes.
      // No-op for now; a media library could record the asset here.
      onUploadCompleted: async () => {},
    });
  },
};
