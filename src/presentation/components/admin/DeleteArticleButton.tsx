"use client";

export function DeleteArticleButton({
  id,
  action,
}: {
  id: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !window.confirm("이 아티클을 삭제하시겠어요? 되돌릴 수 없습니다.")
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/40"
      >
        삭제
      </button>
    </form>
  );
}
