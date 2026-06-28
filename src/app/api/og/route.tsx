import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/config/site";

import { EMOJI_SVG } from "./emojiSvg";

export const runtime = "edge";

const SIZE = { width: 1200, height: 630 };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") ?? SITE_NAME;
  const category = url.searchParams.get("category") ?? "wellness";
  // Byline only renders when an explicit author distinct from the brand is
  // given, so cards without one (e.g. OWTI) don't repeat the brand name twice.
  const author = url.searchParams.get("author");
  const showByline = !!author && author !== SITE_NAME;
  // Optional leading emoji (e.g. OWTI type icon). We render a bundled Twemoji
  // SVG (no runtime CDN fetch); unknown emoji fall back to the raw glyph.
  const emoji = url.searchParams.get("emoji");
  const emojiSvg = emoji ? EMOJI_SVG[emoji] : undefined;

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
          {emojiSvg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={emojiSvg} width={150} height={150} alt="" />
          ) : emoji ? (
            <div style={{ display: "flex", fontSize: 150, lineHeight: 1 }}>
              {emoji}
            </div>
          ) : null}
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: showByline ? "space-between" : "flex-end",
              alignItems: "flex-end",
              color: "#6b6258",
              fontSize: 24,
            }}
          >
            {showByline ? <span>by {author}</span> : null}
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
