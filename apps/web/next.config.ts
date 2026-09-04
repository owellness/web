import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@owellness/shared"],
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "owellness.vercel.app" }],
        destination: "https://www.owellness.co.kr/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
