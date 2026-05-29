import { CATEGORIES } from "@/config/site";
import { categoryService } from "@/composition";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  // Make sure all four categories exist in the DB so the IDs/SEO fields are
  // available even on the first visit after deploy.
  await categoryService.ensureSeeded();
  const rows = await categoryService.listAll().catch(() => []);
  const bySlug = new Map(rows.map((r) => [r.slug, r] as const));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">카테고리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          오 웰니스의 4개 콘텐츠 도메인. 슬러그와 기본 이름은 코드(`config/site.ts`)에서
          관리되며, 발행한 글은 카테고리별로 자동 분류됩니다.
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">슬러그</th>
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">설명</th>
              <th className="px-4 py-3 font-medium">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {CATEGORIES.map((cat) => {
              const dbRow = bySlug.get(cat.slug);
              return (
                <tr key={cat.slug} className="align-top">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    /{cat.slug}
                  </td>
                  <td className="px-4 py-3 font-medium text-card-foreground">
                    {cat.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {cat.description}
                    <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      {cat.keywords.map((kw) => (
                        <li
                          key={kw}
                          className="rounded-full border border-border px-2 py-0.5"
                        >
                          #{kw}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        dbRow
                          ? "bg-accent/15 text-accent"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {dbRow ? "DB 동기화됨" : "미동기화"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        새 카테고리를 추가하려면 `src/config/site.ts`의 CATEGORIES 배열에 항목을 추가하고
        재배포하세요. 카테고리는 SEO·내부 링크 구조와 직접 연결되므로 코드 변경으로
        관리합니다.
      </p>
    </div>
  );
}
