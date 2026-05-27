import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { AnalyticsScripts } from "@/presentation/components/public/AnalyticsScripts";
import { SiteFooter } from "@/presentation/components/public/SiteFooter";
import { SiteHeader } from "@/presentation/components/public/SiteHeader";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <AnalyticsScripts gaId={process.env.NEXT_PUBLIC_GA_ID} />
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
