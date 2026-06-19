import type { MetadataRoute } from "next";
import { ApiService } from "@/lib/api/generated";
import { brandConfig } from "@/lib/config/brand";

const PAGE_SIZE = 100;
const MAX_PAGES = Number(process.env.SITEMAP_MAX_PAGES || 50);

// Refresh frequently after catalog URL changes; ISR still caches between rebuilds.
export const revalidate = 300;

const staticPaths = [
  "",
  "/products",
  "/articles",
  "/categories",
  "/promotions",
  "/reviews",
  "/videos",
  "/faq",
  "/shipping",
  "/budget-search",
  "/financing",
  "/match-score",
  "/contact",
  "/privacy",
  "/terms",
];

const getBaseUrl = () => brandConfig.siteUrl.replace(/\/+$/, "");

const buildStaticEntries = (): MetadataRoute.Sitemap => {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();
  return staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
};

const addEntry = (
  entries: MetadataRoute.Sitemap,
  seen: Set<string>,
  entry: MetadataRoute.Sitemap[number],
) => {
  if (seen.has(entry.url)) return;
  seen.add(entry.url);
  entries.push(entry);
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();
  const refreshedAt = new Date();

  for (const entry of buildStaticEntries()) {
    addEntry(entries, seen, entry);
  }

  try {
    let page = 1;
    let hasNext = true;

    while (hasNext && page <= MAX_PAGES) {
      const response = await ApiService.apiV1PublicProductsList(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        page,
        PAGE_SIZE,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      for (const product of response.results ?? []) {
        const slug = product.slug?.trim();
        if (!slug) continue;

        addEntry(entries, seen, {
          url: `${baseUrl}/products/${slug}`,
          lastModified: refreshedAt,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }

      hasNext = response.next != null;
      page += 1;
    }

    let articlePage = 1;
    let articlesHasNext = true;

    while (articlesHasNext && articlePage <= MAX_PAGES) {
      const articleResponse = await ApiService.apiV1PublicArticlesList(
        undefined,
        undefined,
        "-published_at",
        articlePage,
        PAGE_SIZE,
      );

      for (const article of articleResponse.results ?? []) {
        const productSlug = article.product_slug?.trim();
        const articleSlug = article.slug?.trim();
        if (!productSlug || !articleSlug) continue;

        addEntry(entries, seen, {
          url: `${baseUrl}/products/${productSlug}/blog/${articleSlug}`,
          lastModified: article.published_at ? new Date(article.published_at) : refreshedAt,
          changeFrequency: "monthly",
          priority: 0.74,
        });
      }

      articlesHasNext = articleResponse.next != null;
      articlePage += 1;
    }
  } catch {
    return entries.length ? entries : buildStaticEntries();
  }

  return entries;
}
