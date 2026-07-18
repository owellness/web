import Link from "next/link";

import type { ArticleSummary } from "@/application/articles/model";

const formatDate = (date: Date | null): string => {
  if (!date) return "초안";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const formatReadingTime = (sec: number): string => {
  const min = Math.max(1, Math.round(sec / 60));
  return `${min}분 읽기`;
};

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <Link
      href={`/${article.primaryCategorySlug}/${article.slug}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition hover:border-accent/40 hover:bg-muted/40"
    >
      <p className="text-xs font-medium uppercase tracking-widest text-accent">
        {article.authorName} · {formatReadingTime(article.readingTimeSec)}
      </p>
      <h3 className="text-lg font-semibold leading-snug text-card-foreground group-hover:text-accent">
        {article.title}
      </h3>
      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {article.excerpt}
      </p>
      <p className="mt-auto text-xs text-muted-foreground">
        {formatDate(article.publishedAt)}
      </p>
    </Link>
  );
}
