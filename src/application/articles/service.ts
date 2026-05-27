import { CATEGORY_BY_SLUG, type CategorySlug } from "@/config/site";
import { notFound, validationFailed } from "@/application/shared/errors";
import type { Paginated, Pagination } from "@/application/shared/pagination";
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

  async list(
    filter: ArticleListFilter,
    pagination: Pagination,
  ): Promise<Paginated<ArticleSummary>> {
    return repository.listSummaries(filter, pagination);
  },

  async listForSitemap() {
    return repository.listAllPublishedForSitemap();
  },

  async upsert(rawInput: unknown): Promise<Article> {
    const parsed = articleInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw validationFailed(parsed.error.message);
    }
    const input: ArticleInput = parsed.data;

    if (!(input.primaryCategorySlug in CATEGORY_BY_SLUG)) {
      throw validationFailed(
        `Unknown category: ${input.primaryCategorySlug}`,
      );
    }

    const rendered = await htmlRenderer.renderTiptapToHtml(input.contentJson);

    const article = await repository.upsert({
      ...input,
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
});

export type ArticleService = ReturnType<typeof createArticleService>;
