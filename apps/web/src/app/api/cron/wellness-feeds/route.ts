import { externalContentService } from "@/composition";

export const maxDuration = 60;

const isAuthorized = (request: Request): boolean => {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
};

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const report = await externalContentService.sync();
  const failed = report.sources.some((source) => source.status === "failed");
  if (failed) {
    console.error("[wellness-feeds] sync failed", report);
  }

  return Response.json(report, { status: failed ? 503 : 200 });
}
