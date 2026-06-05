import Link from "next/link";

import { categoryService } from "@/composition";
import { SITE_NAME } from "@/config/site";

export async function SiteFooter() {
  const year = new Date().getFullYear();
  const cats = await categoryService.listAll().catch(() => []);
  return (
    <footer className="mt-24 border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-base font-semibold text-foreground">{SITE_NAME}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            수면, 영양, 운동, 여성 건강까지. 근거 기반 웰니스 콘텐츠를 매주
            전달합니다.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">카테고리</p>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {cats.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/${cat.slug}`} className="hover:text-foreground">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">안내</p>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>
              <Link href="/about" className="hover:text-foreground">
                소개
              </Link>
            </li>
            <li>
              <Link href="/newsletter" className="hover:text-foreground">
                뉴스레터 구독
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-foreground">
                자주 묻는 질문
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© {year} {SITE_NAME}. All rights reserved.</p>
          <p>
            본 사이트의 콘텐츠는 의학적 조언을 대체하지 않으며 정보 제공만을
            목적으로 합니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
