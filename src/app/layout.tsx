import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { SITE_CONFIG, SITE_NAME, SITE_URL } from "@/config/site";
import "./globals.css";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  variable: "--font-pretendard",
  weight: "45 920",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | 근거 기반 웰니스 콘텐츠`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_CONFIG.description,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_CONFIG.authorOrg.name, url: SITE_CONFIG.authorOrg.url }],
  category: "health",
  openGraph: {
    type: "website",
    locale: SITE_CONFIG.locale,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | 근거 기반 웰니스 콘텐츠`,
    description: SITE_CONFIG.description,
    images: [SITE_CONFIG.defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_CONFIG.description,
  },
  robots: { index: true, follow: true },
  verification: {
    google: SITE_CONFIG.verification.google,
    other: SITE_CONFIG.verification.naver
      ? { "naver-site-verification": SITE_CONFIG.verification.naver }
      : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#14110f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
