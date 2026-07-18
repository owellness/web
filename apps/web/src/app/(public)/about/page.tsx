import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ABOUT_SLUG } from "@/application/pages/defaults";
import {
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
} from "@/application/seo/jsonld";
import { SITE_CONFIG, SITE_NAME, SITE_URL } from "@/config/site";
import { JsonLd } from "@/presentation/components/public/JsonLd";

import { pageService } from "@/composition";

export const revalidate = 300;

const ABOUT_URL = `${SITE_URL}/${ABOUT_SLUG}`;

export async function generateMetadata(): Promise<Metadata> {
  const page = await pageService.getForPublic(ABOUT_SLUG).catch(() => null);
  if (!page) return {};
  return {
    title: page.seoTitle ?? page.title,
    description:
      page.seoDescription ??
      `${SITE_NAME} 소개 — 근거 기반 웰니스 콘텐츠를 발행하는 콘텐츠 허브입니다.`,
    alternates: { canonical: ABOUT_URL },
    openGraph: {
      type: "website",
      url: ABOUT_URL,
      title: page.seoTitle ?? page.title,
      description: page.seoDescription ?? undefined,
      siteName: SITE_NAME,
    },
  };
}

export default async function AboutPage() {
  const page = await pageService.getForPublic(ABOUT_SLUG).catch(() => null);
  if (!page) notFound();

  return (
    <>
      <JsonLd schema={buildOrganizationJsonLd(SITE_CONFIG)} />
      <JsonLd
        schema={buildBreadcrumbJsonLd([
          { name: SITE_NAME, url: SITE_URL },
          { name: page.title, url: ABOUT_URL },
        ])}
      />

      <article className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6">
        <nav
          aria-label="breadcrumb"
          className="mb-6 text-sm text-muted-foreground"
        >
          <Link href="/" className="hover:text-foreground">
            홈
          </Link>
          <span aria-hidden> · </span>
          <span>소개</span>
        </nav>

        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            About
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {page.title}
          </h1>
        </header>

        <div
          className="prose-article mt-10 leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
        />
      </article>
    </>
  );
}
