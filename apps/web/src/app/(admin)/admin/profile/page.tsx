import { redirect } from "next/navigation";

import { AuthorProfileForm } from "@/presentation/components/admin/AuthorProfileForm";
import { updateAuthorProfileAction } from "@/presentation/actions/authors";
import { auth } from "@/infrastructure/auth/authConfig";
import { authorService } from "@/composition";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/admin/login");
  }

  // Resolves the author row tied to the logged-in admin (creating it on first
  // visit), so the form is always pre-filled with the current public profile.
  const author = await authorService.getOrCreateForUser({
    userId: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">프로필</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          저자 페이지에 표시되는 이름·사진·소개를 수정합니다. 저장 즉시 공개
          사이트에 반영됩니다.
        </p>
      </header>
      <AuthorProfileForm initial={author} action={updateAuthorProfileAction} />
    </div>
  );
}
