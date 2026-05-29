"use client";

export function DeleteCategoryButton({
  id,
  name,
  action,
}: {
  id: string;
  name: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `'${name}' 카테고리를 삭제하시겠어요?\n속한 아티클이 있으면 삭제할 수 없습니다.`,
          )
        ) {
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
