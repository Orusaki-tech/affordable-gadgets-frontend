import type { MetadataRoute } from "next";
import { ApiService } from "@/lib/api/generated";
import { brandConfig } from "@/lib/config/brand";

const PAGE_SIZE = 100;
const MAX_PAGES = Number(process.env.SITEMAP_MAX_PAGES || 20);

export const revalidate = 3600;

const staticPaths = [
  "",
  "/products",
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const entries: MetadataRoute.Sitemap = [...buildStaticEntries()];

  try {
    let page = 1;
    let hasNext = true;
    const allResults: Array<{ slug?: string; has_published_article?: boolean }> = [];

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
        undefined
      );
      allResults.push(...(response.results ?? []));
      hasNext = response.next != null;
      page += 1;
    }

    for (const product of allResults) {
      if (!product.slug) {
        continue;
      }
      entries.push({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
      if (product.has_published_article) {
        entries.push({
          url: `${baseUrl}/products/${product.slug}/blog`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.75,
        });
      }
    }
  } catch {
    return entries;
  }

  return entries;
}
