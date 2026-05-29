import { auth } from "@/infrastructure/auth/authConfig";
import { mediaService } from "@/composition";

export const dynamic = "force-dynamic";

// Vercel Blob client-upload endpoint. The browser calls this to (1) obtain a
// scoped upload token and (2) notify completion. Admin authorization is
// enforced during token generation, where the request still carries cookies.
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const result = await mediaService.handleUpload({
      body,
      request,
      authorizeUpload: async () => {
        const session = await auth();
        return session?.user?.role === "admin";
      },
    });
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed";
    const status = /unauthorized/i.test(message) ? 401 : 400;
    return Response.json({ error: message }, { status });
  }
}
