import { auth } from "@/infrastructure/auth/authConfig";
import { mediaService } from "@/composition";

export const dynamic = "force-dynamic";

// Vercel Blob client-upload endpoint. The browser calls this to (1) obtain a
// scoped upload token and (2) notify completion. Admin authorization is
// enforced during token generation, where the request still carries cookies.
export async function POST(request: Request): Promise<Response> {
  // Fail loudly (in logs) when the Blob store isn't connected — this is the
  // most common cause of "Failed to retrieve the client token" on the client.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error(
      "[upload] BLOB_READ_WRITE_TOKEN is not set. Connect a Vercel Blob store to the project and redeploy.",
    );
    return Response.json(
      { error: "Blob storage is not configured (BLOB_READ_WRITE_TOKEN)." },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const result = await mediaService.handleUpload({
      body,
      request,
      authorizeUpload: async () => {
        const session = await auth();
        const ok = session?.user?.role === "admin";
        if (!ok) {
          console.error("[upload] Unauthorized: no admin session on token request");
        }
        return ok;
      },
    });
    return Response.json(result);
  } catch (error) {
    console.error("[upload] handleUpload failed:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    const status = /unauthorized/i.test(message) ? 401 : 400;
    return Response.json({ error: message }, { status });
  }
}
