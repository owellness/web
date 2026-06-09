import type {
  Article as ArticleSchema,
  BreadcrumbList,
  FAQPage,
  HowTo,
  MedicalWebPage,
  Organization,
  Person,
  WebSite,
  WithContext,
} from "schema-dts";

export type SiteIdentity = {
  name: string;
  nameEn?: string;
  legalName: string;
  url: string;
  description: string;
  defaultOgImage: string;
  social?: {
    instagram?: string | null | undefined;
    youtube?: string | null | undefined;
  };
};

export const buildOrganizationJsonLd = (
  site: SiteIdentity,
): WithContext<Organization> => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${site.url}/#organization`,
  name: site.legalName,
  alternateName: site.nameEn,
  url: site.url,
  description: site.description,
  logo: {
    "@type": "ImageObject",
    url: `${site.url}/logo.png`,
  },
  sameAs: [site.social?.instagram, site.social?.youtube].filter(
    (s): s is string => Boolean(s),
  ),
});

export const buildWebSiteJsonLd = (site: SiteIdentity): WithContext<WebSite> => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${site.url}/#website`,
  name: site.name,
  url: site.url,
  description: site.description,
  inLanguage: "ko-KR",
  publisher: { "@id": `${site.url}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${site.url}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  } as unknown as WithContext<WebSite>["potentialAction"],
});

export const buildBreadcrumbJsonLd = (
  items: { name: string; url: string }[],
): WithContext<BreadcrumbList> => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: item.name,
    item: item.url,
  })),
});

export type ArticleJsonLdInput = {
  title: string;
  description: string;
  url: string;
  imageUrl: string | null | undefined;
  publishedAt: Date | null;
  updatedAt: Date;
  author: { name: string; url: string };
  publisher: { name: string; url: string; logoUrl: string };
  isMedical?: boolean;
  reviewedBy?: { name: string; url: string } | null;
  speakableSelectors?: ReadonlyArray<string>;
};

export const buildArticleJsonLd = (
  input: ArticleJsonLdInput,
): WithContext<ArticleSchema | MedicalWebPage> => {
  const speakable =
    input.speakableSelectors && input.speakableSelectors.length > 0
      ? {
          "@type": "SpeakableSpecification" as const,
          cssSelector: [...input.speakableSelectors],
        }
      : undefined;

  const base = {
    "@context": "https://schema.org" as const,
    headline: input.title,
    description: input.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
    image: input.imageUrl ?? undefined,
    datePublished: input.publishedAt?.toISOString(),
    dateModified: input.updatedAt.toISOString(),
    author: {
      "@type": "Person" as const,
      name: input.author.name,
      url: input.author.url,
    },
    publisher: {
      "@type": "Organization" as const,
      name: input.publisher.name,
      url: input.publisher.url,
      logo: {
        "@type": "ImageObject" as const,
        url: input.publisher.logoUrl,
      },
    },
    speakable,
    inLanguage: "ko-KR",
  };

  if (input.isMedical) {
    return {
      ...base,
      "@type": "MedicalWebPage",
      lastReviewed: input.updatedAt.toISOString(),
      reviewedBy: input.reviewedBy
        ? {
            "@type": "Person",
            name: input.reviewedBy.name,
            url: input.reviewedBy.url,
          }
        : undefined,
    } as WithContext<MedicalWebPage>;
  }

  return { ...base, "@type": "Article" } as WithContext<ArticleSchema>;
};

export const buildFaqJsonLd = (
  items: { question: string; answerHtml: string }[],
): WithContext<FAQPage> => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answerHtml,
    },
  })),
});

export const buildHowToJsonLd = (input: {
  name: string;
  description: string;
  estimatedMinutes?: number | null;
  tools: string[];
  steps: { name: string; text: string; imageUrl?: string | null }[];
}): WithContext<HowTo> => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: input.name,
  description: input.description,
  totalTime: input.estimatedMinutes
    ? `PT${input.estimatedMinutes}M`
    : undefined,
  tool: input.tools.map((name) => ({ "@type": "HowToTool", name })),
  step: input.steps.map((step, idx) => ({
    "@type": "HowToStep",
    position: idx + 1,
    name: step.name,
    text: step.text,
    image: step.imageUrl ?? undefined,
  })),
});

export const buildPersonJsonLd = (input: {
  name: string;
  url: string;
  bio: string;
  avatarUrl?: string | null;
  affiliation?: string | null;
  sameAs?: string[];
}): WithContext<Person> => ({
  "@context": "https://schema.org",
  "@type": "Person",
  name: input.name,
  url: input.url,
  description: input.bio,
  image: input.avatarUrl ?? undefined,
  affiliation: input.affiliation
    ? { "@type": "Organization", name: input.affiliation }
    : undefined,
  sameAs: input.sameAs,
});
