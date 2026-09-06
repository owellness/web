import type { Metadata } from "next";
import Link from "next/link";

import { listPrototypes } from "./_lib/registry";

export const metadata: Metadata = {
  title: "디자인 프로토타입",
  description: "Claude Design 익스포트를 URL로 열어보는 프로토타입 목록입니다.",
  robots: { index: false, follow: false },
};

export default async function PrototypeIndexPage() {
  const prototypes = await listPrototypes();

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        디자인 프로토타입
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          apps/web/public/prototypes/
        </code>{" "}
        에 있는 Claude Design 익스포트(<code>*.dc.html</code>)를 그대로
        렌더링합니다.
      </p>

      {prototypes.length === 0 ? (
        <div className="mt-10 rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-medium">아직 등록된 디자인이 없습니다</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Claude Design 프로젝트에서 파일을 내려받아 아래 위치에 그대로
            넣으면 이 목록에 자동으로 나타납니다. 익스포트가 함께 import 하는
            파일(<code>ios-frame.jsx</code>, <code>support.js</code> 등)도 같은
            폴더에 두어야 합니다.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 font-mono text-xs leading-relaxed">
            {[
              "apps/web/public/prototypes/",
              "├─ O Wellness UI.dc.html   → /prototype/o-wellness-ui",
              "├─ ios-frame.jsx",
              "└─ support.js",
            ].join("\n")}
          </pre>
        </div>
      ) : (
        <ul className="mt-10 space-y-3">
          {prototypes.map((prototype) => (
            <li key={prototype.slug}>
              <Link
                href={`/prototype/${prototype.slug}`}
                className="flex items-baseline justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:border-accent"
              >
                <span className="font-medium">{prototype.title}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  /prototype/{prototype.slug}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
