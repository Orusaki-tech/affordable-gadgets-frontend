import type { MetadataRoute } from "next";
import { ApiService } from "@/lib/api/generated";
import { brandConfig } from "@/lib/config/brand";

const PAGE_SIZE = 200;
const MAX_PAGES = Number(process.env.SITEMAP_MAX_PAGES || 5);

const staticPaths = [
  "",
  "/products",
  "/categories",
  "/promotions",
  "/reviews",
  "/videos",
  "/budget-search",
  "/match-score",
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
    const firstPage = await ApiService.apiV1PublicProductsList(
      undefined,
      undefined,
      undefined,
      undefined,
      1,
      PAGE_SIZE,
      undefined,
      undefined,
      undefined,
      undefined
    );

    const totalPages = Math.max(1, Math.ceil(firstPage.count / PAGE_SIZE));
    const cappedTotalPages = Math.min(totalPages, MAX_PAGES);
    const allResults = [...(firstPage.results ?? [])];

    for (let page = 2; page <= cappedTotalPages; page += 1) {
      const response = await ApiService.apiV1PublicProductsList(
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
    }
  } catch {
    return entries;
  }

  return entries;
}
