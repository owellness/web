import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/config/site";

export const runtime = "edge";

const SIZE = { width: 1200, height: 630 };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") ?? SITE_NAME;
  const category = url.searchParams.get("category") ?? "wellness";
  const author = url.searchParams.get("author") ?? SITE_NAME;
  // Optional leading emoji (e.g. OWTI type icon). Rendered via Twemoji by
  // ImageResponse's default `emoji` option; omitted when not provided.
  const emoji = url.searchParams.get("emoji");

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #fbfaf7 0%, #f3f0ea 60%, #e7e2d8 100%)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: 22,
            fontWeight: 600,
            color: "#3b7a57",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#3b7a57",
              // satori (next/og) only supports flex/block/contents/none — not
              // inline-block, which throws and 500s the whole image.
              display: "flex",
            }}
          />
          {category}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            color: "#14110f",
          }}
        >
          {emoji ? (
            <div style={{ display: "flex", fontSize: 104, lineHeight: 1 }}>
              {emoji}
            </div>
          ) : null}
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              color: "#6b6258",
              fontSize: 22,
            }}
          >
            <span>by {author}</span>
            <span style={{ fontWeight: 600, color: "#14110f" }}>
              {SITE_NAME}
            </span>
          </div>
        </div>
      </div>
    ),
    { ...SIZE },
  );
}
