// Handles the Vercel Blob client-upload token exchange. The route handler owns
// the request; this port abstracts the storage-provider specifics.
export interface MediaUploadPort {
  handleClientUpload(input: {
    body: unknown;
    request: Request;
    // Runs during the token-generation phase (which carries the admin's
    // cookies). The completion callback is authenticated by the blob token, so
    // authorization is only enforced here.
    authorizeUpload: () => Promise<boolean>;
    allowedContentTypes: readonly string[];
    maxSizeBytes: number;
  }): Promise<unknown>;
}
