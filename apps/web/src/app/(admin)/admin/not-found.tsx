import Link from "next/link";

// Shown when an admin page calls notFound() — e.g. opening the edit page for an
// article that has already been deleted. Friendlier than the default 404.
export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-card-foreground">
        찾을 수 없습니다
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        요청한 항목이 없거나 이미 삭제되었습니다.
      </p>
      <div className="mt-6 flex justify-center">
        <Link
          href="/admin/articles"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          아티클 목록으로
        </Link>
      </div>
    </div>
  );
}
