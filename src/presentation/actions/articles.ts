"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ArticleInput, TiptapDocument } from "@/application/articles/model";
import { ApplicationError, forbidden } from "@/application/shared/errors";

import { auth } from "@/infrastructure/auth/authConfig";
import {
  articleService,
  authorService,
} from "@/composition";

const requireAdmin = async () => {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw forbidden("관리자만 사용할 수 있습니다.");
  }
  return session.user;
};

const parseJson = (raw: FormDataEntryValue | null): TiptapDocument => {
  try {
    return JSON.parse(String(raw ?? "{}"));
  } catch {
    return { type: "doc", content: [] };
  }
};

const nullableString = (raw: FormDataEntryValue | null): string | null => {
  const value = String(raw ?? "").trim();
  return value.length > 0 ? value : null;
};

export type ArticleFormResult = { ok: true } | { ok: false; error: string };

export async function submitArticleAction(
  formData: FormData,
): Promise<ArticleFormResult> {
  try {
    const user = await requireAdmin();
    const author = await authorService.getOrCreateForUser({
      userId: user.id,
      email: user.email ?? "",
      name: user.name ?? null,
    });

    const tagSlugs = String(formData.get("tagSlugs") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const tldr = String(formData.get("tldr") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const idValue = String(formData.get("id") ?? "").trim();
    const id = idValue.length > 0 ? idValue : undefined;

    const input: ArticleInput = {
      id,
      slug: String(formData.get("slug") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      excerpt: String(formData.get("excerpt") ?? "").trim(),
      tldr,
      contentJson: parseJson(formData.get("contentJson")),
      status:
        String(formData.get("status") ?? "draft") === "published"
          ? "published"
          : "draft",
      primaryCategorySlug: String(formData.get("primaryCategorySlug") ?? ""),
      tagSlugs,
      authorId: author.id,
      seoTitle: nullableString(formData.get("seoTitle")),
      seoDescription: nullableString(formData.get("seoDescription")),
      ogImageUrl: nullableString(formData.get("ogImageUrl")),
    };

    await articleService.upsert(input);
    revalidatePath("/admin/articles");
    return { ok: true };
  } catch (e) {
    if (e instanceof ApplicationError) {
      return { ok: false, error: e.message };
    }
    console.error("[submitArticleAction]", e);
    const detail = e instanceof Error ? e.message : String(e);
    const hint = /relation .* does not exist/i.test(detail)
      ? " (DB 테이블이 없습니다. deploy.sql을 실행했는지 확인하세요.)"
      : "";
    return {
      ok: false,
      error: `저장 중 오류가 발생했습니다.${hint}`,
    };
  }
}

export async function deleteArticleAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  try {
    await articleService.delete(id);
  } catch (e) {
    console.error("[deleteArticleAction]", e);
    throw e;
  }
  revalidatePath("/admin/articles");
  redirect("/admin/articles");
}
