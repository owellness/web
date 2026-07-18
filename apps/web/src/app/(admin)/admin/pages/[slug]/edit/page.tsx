import { notFound } from "next/navigation";

import { pageService } from "@/composition";
import { PageForm } from "@/presentation/components/admin/PageForm";
import { savePageAction } from "@/presentation/actions/pages";

export const dynamic = "force-dynamic";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await pageService.ensureSeeded().catch(() => {});
  const page = await pageService.getBySlug(slug).catch(() => null);
  if (!page) notFound();

  const publicPath = `/${page.slug}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">페이지 수정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          공개 URL: <code>{publicPath}</code>
        </p>
      </header>
      <PageForm
        slug={page.slug}
        publicPath={publicPath}
        initial={page}
        action={savePageAction}
      />
    </div>
  );
}
