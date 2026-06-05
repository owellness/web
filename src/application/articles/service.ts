import { type CategorySlug } from "@/config/site";
import { notFound, validationFailed } from "@/application/shared/errors";
import type { Paginated, Pagination } from "@/application/shared/pagination";
import { slugify } from "@/application/shared/slug";
import { extractFirstImageUrl } from "@/application/seo/articleMeta";
import { articleInputSchema, type Article, type ArticleInput, type ArticleSummary } from "./model";
import type {
  ArticleListFilter,
  ArticleRepository,
  HtmlRenderer,
  RevalidationPort,
} from "./ports";

export type ArticleServiceDeps = {
  repository: ArticleRepository;
  htmlRenderer: HtmlRenderer;
  revalidation: RevalidationPort;
};

export const createArticleService = ({
  repository,
  htmlRenderer,
  revalidation,
}: ArticleServiceDeps) => ({
  async getBySlug(slug: string): Promise<Article> {
    const article = await repository.findBySlug(slug);
    if (!article) throw notFound("Article");
    return article;
  },

  async getById(id: string): Promise<Article> {
    const article = await repository.findById(id);
    if (!article) throw notFound("Article");
    return article;
  },

  async list(
    filter: ArticleListFilter,
    pagination: Pagination,
  ): Promise<Paginated<ArticleSummary>> {
    return repository.listSummaries(filter, pagination);
  },

  async listForSitemap() {
    return repository.listAllPublishedForSitemap();
  },

  async listAllPublishedFull() {
    return repository.listAllPublishedFull();
  },

  async upsert(rawInput: unknown): Promise<Article> {
    // Slug: use what the admin typed (romanized). When left blank, generate a
    // short numeric slug from a DB sequence so URLs stay clean and copyable.
    const candidate = (rawInput ?? {}) as Record<string, unknown>;
    const typedSlug = typeof candidate.slug === "string" ? candidate.slug : "";
    let normalizedSlug = slugify(typedSlug);
    if (!normalizedSlug) {
      normalizedSlug = String(await repository.nextSlugNumber());
    }

    const parsed = articleInputSchema.safeParse({
      ...candidate,
      slug: normalizedSlug,
    });
    if (!parsed.success) {
      throw validationFailed(parsed.error.message);
    }
    const input: ArticleInput = parsed.data;

    const rendered = await htmlRenderer.renderTiptapToHtml(input.contentJson);

    // Auto-fill the OG image from the first body image when not set explicitly.
    const ogImageUrl =
      input.ogImageUrl ?? extractFirstImageUrl(rendered.html) ?? null;

    const article = await repository.upsert({
      ...input,
      ogImageUrl,
      contentHtml: rendered.html,
      readingTimeSec: rendered.readingTimeSec,
    });

    if (article.status === "published") {
      await Promise.all([
        revalidation.revalidateArticle(
          article.slug,
          article.primaryCategorySlug as CategorySlug,
        ),
        revalidation.revalidateCategory(
          article.primaryCategorySlug as CategorySlug,
        ),
        revalidation.revalidateHome(),
      ]);
    }

    return article;
  },

  async delete(id: string): Promise<void> {
    // Load the article first so we know which URLs to revalidate after delete.
    const article = await repository.findById(id);
    if (!article) throw notFound("Article");
    await repository.delete(id);
    await Promise.all([
      revalidation.revalidateArticle(
        article.slug,
        article.primaryCategorySlug as CategorySlug,
      ),
      revalidation.revalidateCategory(
        article.primaryCategorySlug as CategorySlug,
      ),
      revalidation.revalidateHome(),
    ]);
  },
});

export type ArticleService = ReturnType<typeof createArticleService>;
