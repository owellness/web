import { notFound } from "next/navigation";

import { faqService } from "@/composition";
import { FaqItemForm } from "@/presentation/components/admin/FaqItemForm";
import { updateFaqItemAction } from "@/presentation/actions/faq";

export const dynamic = "force-dynamic";

export default async function EditFaqPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await faqService.findById(id).catch(() => null);
  if (!item) notFound();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">FAQ 수정</h1>
      </header>
      <FaqItemForm
        initial={item}
        action={updateFaqItemAction}
        submitLabel="저장"
      />
    </div>
  );
}
