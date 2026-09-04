import Link from "next/link";

import type { ExternalContentSummary } from "@/application/externalContent/model";

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

const sourceMark = (source: string): string =>
  source
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function ExternalContentSection({
  items,
}: {
  items: ExternalContentSummary[];
}) {
  return (
    <section
      id="global-wellness-briefing"
      aria-labelledby="global-wellness-briefing-title"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Global Wellness Briefing
          </p>
          <h2
            id="global-wellness-briefing-title"
            className="mt-2 text-2xl font-semibold tracking-tight text-foreground"
          >
            해외 웰니스 새 글을 한국어로
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            각 사이트가 RSS로 제공한 제목과 소개, 본문을 번역해 전합니다.
            카드에서 번역문을 읽고 영문 원문도 함께 확인할 수 있어요.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          기계 번역 · 별도 의료 검수 없음
          {items.length > 0 ? (
            <>
              {" · "}
              <a
                href="https://papago.naver.com/"
                target="_blank"
                rel="noopener noreferrer external"
                className="underline decoration-border underline-offset-2 hover:text-foreground"
              >
                Papago 번역
              </a>
            </>
          ) : null}
        </p>
      </div>

      {items.length > 0 ? (
        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="flex">
              <Link
                href={`/briefings/${item.id}`}
                className="group flex min-h-64 flex-1 flex-col rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="grid size-8 place-items-center rounded-full bg-accent/10 text-[0.65rem] font-bold tracking-tight text-accent"
                    >
                      {sourceMark(item.sourceName)}
                    </span>
                    <span className="text-xs font-semibold text-accent">
                      {item.sourceName}
                    </span>
                  </div>
                  <time
                    dateTime={item.sourcePublishedAt.toISOString()}
                    className="shrink-0 text-xs text-muted-foreground"
                  >
                    {formatDate(item.sourcePublishedAt)}
                  </time>
                </div>
                <h3 className="mt-5 text-lg font-semibold leading-snug text-card-foreground group-hover:text-accent">
                  {item.title}
                </h3>
                {item.excerpt ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {item.excerpt}
                  </p>
                ) : null}
                <div className="mt-auto flex items-end gap-3 pt-6">
                  {item.sourceAuthor ? (
                    <span className="text-xs text-muted-foreground">
                      {item.sourceAuthor}
                    </span>
                  ) : null}
                  <span className="ml-auto text-sm font-medium text-foreground">
                    번역문 보기 <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
          <p className="text-sm font-medium text-foreground">
            첫 해외 브리핑을 준비하고 있어요.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            번역 권한과 자동 번역 설정이 완료되면 최신 글이 여기에 표시됩니다.
          </p>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        이 섹션은 원문을 대체하지 않는 미검수 자동 번역 안내이며 출처와의
        제휴·보증을 의미하지 않습니다. 콘텐츠의 권리는 각 원저작권자에게
        있습니다. 건강 관련 결정은 원문과 전문가의 조언을 함께 확인하세요.
      </p>
    </section>
  );
}
