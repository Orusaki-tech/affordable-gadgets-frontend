import type { MetadataRoute } from "next";
import { ApiService } from "@/lib/api/generated";
import { brandConfig } from "@/lib/config/brand";
import { PRODUCT_TYPES } from "@/lib/config/nav-links";
import { listIndexableProductListingPaths } from "@/lib/seo/indexableProductListings";

const PAGE_SIZE = 100;
const MAX_PAGES = Number(process.env.SITEMAP_MAX_PAGES || 50);

// Refresh frequently after catalog URL changes; ISR still caches between rebuilds.
export const revalidate = 300;

const getBaseUrl = () => brandConfig.siteUrl.replace(/\/+$/, "");

/** Next.js sitemap serialization does not XML-escape `&` in query strings. */
function xmlEscapeUrl(url: string): string {
  return url
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const addEntry = (
  entries: MetadataRoute.Sitemap,
  seen: Set<string>,
  entry: MetadataRoute.Sitemap[number],
) => {
  const url = xmlEscapeUrl(entry.url);
  if (seen.has(url)) return;
  seen.add(url);
  entries.push({ ...entry, url });
};

const parseLastModified = (value?: string | null, fallback?: Date) => {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return fallback ?? new Date();
};

function absoluteUrl(baseUrl: string, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!path || path === "/") return baseUrl;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const refreshedAt = new Date();
  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];
  const optionalTail: MetadataRoute.Sitemap = [];

  const { mainNav, shopByBrand, optionalBrands } =
    listIndexableProductListingPaths();

  const push = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly",
    bucket: MetadataRoute.Sitemap = entries,
  ) => {
    addEntry(bucket, seen, {
      url: absoluteUrl(baseUrl, path),
      lastModified: refreshedAt,
      changeFrequency,
      priority,
    });
  };

  // 1. Main navigation (prime marketing space — same order as header / llms.txt)
  push("/", 1.0, "daily");
  for (const path of mainNav) push(path, 0.95);
  push("/articles", 0.95);
  push("/financing", 0.95);

  // 2. Shop by brand / type
  push("/products", 0.9);
  for (const path of shopByBrand) push(path, 0.9);
  push("/promotions", 0.9);

  // 3. Blog hubs
  for (const type of PRODUCT_TYPES) {
    push(`/articles?type=${type}`, 0.85);
  }

  // 4. Customer help
  for (const path of [
    "/faq",
    "/shipping",
    "/contact",
    "/reviews",
    "/videos",
  ]) {
    push(path, 0.7);
  }

  // 5–6. Products then articles (lower priority than marketing)
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
          lastModified: parseLastModified(product.updated_at, refreshedAt),
          changeFrequency: "weekly",
          priority: 0.6,
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
        if (!articleSlug) continue;

        if (productSlug) {
          addEntry(entries, seen, {
            url: `${baseUrl}/products/${productSlug}/blog/${articleSlug}`,
            lastModified: parseLastModified(
              article.updated_at ?? article.published_at,
              refreshedAt,
            ),
            changeFrequency: "monthly",
            priority: 0.55,
          });
        } else {
          addEntry(entries, seen, {
            url: `${baseUrl}/blog/${articleSlug}`,
            lastModified: parseLastModified(
              article.updated_at ?? article.published_at,
              refreshedAt,
            ),
            changeFrequency: "monthly",
            priority: 0.55,
          });
        }
      }

      articlesHasNext = articleResponse.next != null;
      articlePage += 1;
    }
  } catch {
    // Keep marketing entries even if catalog fetch fails.
  }

  // 7. Optional — More brands + legal
  for (const path of optionalBrands) {
    push(path, 0.4, "weekly", optionalTail);
  }
  push("/privacy", 0.4, "yearly", optionalTail);
  push("/terms", 0.4, "yearly", optionalTail);

  return [...entries, ...optionalTail];
}
