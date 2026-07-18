"use client";

export function DeleteFaqItemButton({
  id,
  question,
  action,
}: {
  id: string;
  question: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`'${question}' 질문을 삭제하시겠어요?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/40"
      >
        삭제
      </button>
    </form>
  );
}
