"use server";

import { revalidatePath } from "next/cache";

import { SOCIAL_PLATFORMS } from "@/application/authors/social";
import { ApplicationError, forbidden } from "@/application/shared/errors";

import { auth } from "@/infrastructure/auth/authConfig";
import { authorService } from "@/composition";

const requireAdmin = async () => {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw forbidden("관리자만 사용할 수 있습니다.");
  }
  return session.user;
};

const nullableString = (raw: FormDataEntryValue | null): string | null => {
  const v = String(raw ?? "").trim();
  return v.length > 0 ? v : null;
};

export type AuthorProfileFormResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateAuthorProfileAction(
  formData: FormData,
): Promise<AuthorProfileFormResult> {
  let savedSlug = "";
  try {
    const user = await requireAdmin();
    // Resolve (or lazily provision) the author row tied to this admin — the
    // same record the public /authors/[slug] page renders.
    const author = await authorService.getOrCreateForUser({
      userId: user.id,
      email: user.email ?? "",
      name: user.name ?? null,
    });

    const social: Record<string, string> = {};
    for (const platform of SOCIAL_PLATFORMS) {
      const value = String(formData.get(`social_${platform.key}`) ?? "").trim();
      if (value.length > 0) social[platform.key] = value;
    }

    const updated = await authorService.updateProfile(author.id, {
      displayName: String(formData.get("displayName") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim(),
      bio: String(formData.get("bio") ?? "").trim(),
      avatarUrl: nullableString(formData.get("avatarUrl")),
      credentials: nullableString(formData.get("credentials")),
      affiliation: nullableString(formData.get("affiliation")),
      websiteUrl: nullableString(formData.get("websiteUrl")),
      social,
    });
    savedSlug = updated.slug;
  } catch (e) {
    if (e instanceof ApplicationError) return { ok: false, error: e.message };
    console.error("[updateAuthorProfileAction]", e);
    return { ok: false, error: "프로필 저장에 실패했습니다." };
  }

  // The author's name/photo appear site-wide (author page, article bylines,
  // cards, JSON-LD), all of which are cached. Purge the layout so every surface
  // reflects the change immediately, then refresh the admin editor.
  revalidatePath("/", "layout");
  revalidatePath("/admin/profile");
  if (savedSlug) revalidatePath(`/authors/${savedSlug}`);
  return { ok: true };
}
