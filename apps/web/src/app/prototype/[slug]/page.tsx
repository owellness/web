import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { findPrototype, listPrototypes } from "../_lib/registry";
import { PrototypeFrame } from "./PrototypeFrame";

// Neither page reads request data, so Next prerenders both at build time —
// which is what makes the registry's `fs` scan safe. `dynamicParams = false`
// keeps unknown slugs a 404 instead of an on-demand render that would have to
// hit a `public/` directory the server may not have.
export const dynamicParams = false;

export async function generateStaticParams() {
  const prototypes = await listPrototypes();
  return prototypes.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const prototype = await findPrototype(slug);
  if (!prototype) return { robots: { index: false, follow: false } };
  return {
    title: `${prototype.title} · 프로토타입`,
    robots: { index: false, follow: false },
  };
}

export default async function PrototypePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const prototype = await findPrototype(slug);
  if (!prototype) notFound();

  return (
    <main className="flex h-dvh flex-col px-5 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/prototype"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ← 프로토타입 목록
          </Link>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">
            {prototype.title}
          </h1>
        </div>
        <a
          href={prototype.href}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent"
        >
          새 탭에서 원본 열기
        </a>
      </header>

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <PrototypeFrame src={prototype.href} title={prototype.title} />
      </div>
    </main>
  );
}
