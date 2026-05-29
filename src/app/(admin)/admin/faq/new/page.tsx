import { FaqItemForm } from "@/presentation/components/admin/FaqItemForm";
import { createFaqItemAction } from "@/presentation/actions/faq";

export const dynamic = "force-dynamic";

export default function NewFaqPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">새 FAQ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          공개 <code>/faq</code> 페이지에 즉시 반영됩니다.
        </p>
      </header>
      <FaqItemForm action={createFaqItemAction} submitLabel="추가" />
    </div>
  );
}
