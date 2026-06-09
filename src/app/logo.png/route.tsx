import { ImageResponse } from "next/og";

import { SITE_NAME_EN } from "@/config/site";

// Brand logo served at /logo.png for Organization + Article `publisher.logo`
// JSON-LD (and social/general use). Generated via the OG runtime so we don't
// depend on a committed binary asset. A Latin wordmark keeps glyphs reliable
// (the OG runtime has no bundled Korean font).
export const runtime = "edge";

const SIZE = { width: 512, height: 512 };

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          background: "#fbfaf7",
        }}
      >
        <div
          style={{
            width: 176,
            height: 176,
            borderRadius: "50%",
            background: "#3b7a57",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#fbfaf7",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#14110f",
              letterSpacing: "-0.02em",
            }}
          >
            {SITE_NAME_EN.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#3b7a57",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
            }}
          >
            Evidence-based
          </div>
        </div>
      </div>
    ),
    { ...SIZE },
  );
}
