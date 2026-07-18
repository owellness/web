import { SITE_NAME } from "@/config/site";
import { subscribeAction } from "@/presentation/actions/newsletter";
import { NewsletterForm } from "./NewsletterForm";

/**
 * Inline newsletter CTA placed below long-form articles. Designed to be a
 * gentle conversion point with the same double-opt-in flow as /newsletter,
 * but with a `source` that lets us see in /admin/subscribers which articles
 * are driving sign-ups.
 */
export function NewsletterCTA({
  source = "article-footer",
}: {
  source?: string;
}) {
  return (
    <aside
      aria-label="뉴스레터 구독"
      className="mt-16 rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">
        Weekly Newsletter
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        매주 받아보는 {SITE_NAME} 뉴스레터
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        이런 글이 좋으셨다면 다음 주 인사이트를 이메일로 받아보세요. 곧 출시될
        오! 웰니스 앱의 진단·코칭 기능 베타도 가장 먼저 알려드립니다.
      </p>
      <div className="mt-5">
        <NewsletterForm
          action={subscribeAction}
          source={source}
          submitLabel="이메일로 받아보기"
        />
      </div>
    </aside>
  );
}
