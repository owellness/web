export default function BriefingLoading() {
  return (
    <div
      role="status"
      className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6"
    >
      <span className="sr-only">번역문 불러오는 중</span>
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="mt-10 h-4 w-52 rounded bg-muted" />
        <div className="mt-5 h-10 w-full rounded bg-muted" />
        <div className="mt-3 h-10 w-4/5 rounded bg-muted" />
        <div className="mt-10 h-24 rounded-2xl bg-muted" />
        <div className="mt-10 space-y-4">
          <div className="h-5 rounded bg-muted" />
          <div className="h-5 rounded bg-muted" />
          <div className="h-5 w-5/6 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
