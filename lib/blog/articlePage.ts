import { ApiService, OpenAPI } from '@/lib/api/generated';
import type { PublicProduct, PublicProductArticle, PublicArticleCard } from '@/lib/api/generated';
import { brandConfig } from '@/lib/config/brand';
import type { ArticleListFilters } from '@/lib/blog/articleFilters';
import type { ArticleProductTypeCode } from '@/lib/blog/articleHubs';

export const BLOG_REVALIDATE = 3600;
/** Keep in sync with FEATURED_PRODUCTS_PAGE_SIZE in lib/hooks/useProducts.ts */
const FEATURED_ARTICLES_PAGE_SIZE = 5;

async function publicApiHeaders(): Promise<Record<string, string>> {
  return {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': '1',
    ...(typeof OpenAPI.HEADERS === 'function'
      ? await OpenAPI.HEADERS({} as never)
      : (OpenAPI.HEADERS ?? {})),
  };
}

/** Articles for homepage blog carousel — one per featured product, same order as featured carousel. */
export async function fetchFeaturedArticles(): Promise<PublicArticleCard[]> {
  try {
    const products = await fetchFeaturedProductsForArticles();
    if (!products.length) return [];

    const articles: PublicArticleCard[] = [];
    await Promise.all(
      products.map(async (product) => {
        if (!product.slug) return;
        const productArticles = await fetchProductArticles(product.slug);
        const card = productArticles.find(isRenderableArticleCard);
        if (card) articles.push(card);
      }),
    );

    const slugOrder = new Map(products.map((product, index) => [product.slug, index]));
    return articles
      .sort(
        (left, right) =>
          (slugOrder.get(left.product_slug!) ?? 0) - (slugOrder.get(right.product_slug!) ?? 0),
      )
      .slice(0, FEATURED_ARTICLES_PAGE_SIZE);
  } catch {
    return [];
  }
}

async function fetchFeaturedProductsForArticles(): Promise<PublicProduct[]> {
  const base = OpenAPI.BASE.replace(/\/+$/, '');
  const url = `${base}/api/v1/public/products/?featured=1&page_size=${FEATURED_ARTICLES_PAGE_SIZE}&page=1`;
  const res = await fetch(url, {
    credentials: 'omit',
    headers: await publicApiHeaders(),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: PublicProduct[] };
  return data.results ?? [];
}

export async function fetchProductBySlug(slug: string): Promise<PublicProduct | null> {
  if (!slug) return null;
  try {
    const response = await ApiService.apiV1PublicProductsList(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      1,
      1,
      undefined,
      undefined,
      slug,
      undefined
    );
    return response.results?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function fetchPrimaryArticle(productSlug: string): Promise<PublicProductArticle | null> {
  try {
    return await ApiService.apiV1PublicProductsBySlugArticleRetrieve(productSlug);
  } catch (e: unknown) {
    const status =
      typeof e === 'object' && e !== null && 'status' in e
        ? (e as { status?: number }).status
        : undefined;
    if (status === 404) return null;
    throw e;
  }
}

function getErrorStatus(e: unknown): number | undefined {
  if (typeof e === 'object' && e !== null && 'status' in e) {
    return (e as { status?: number }).status;
  }
  return undefined;
}

export function normalizeArticleList(
  response: PublicArticleCard[] | { results?: PublicArticleCard[] | null }
): PublicArticleCard[] {
  if (Array.isArray(response)) return response;
  return response.results ?? [];
}

export function isRenderableArticleCard(article: PublicArticleCard): boolean {
  return Boolean(article.slug && article.headline && article.product_slug);
}

export async function fetchAllPublishedArticles(
  filters: ArticleListFilters = {},
): Promise<PublicArticleCard[]> {
  const all: PublicArticleCard[] = [];
  let page = 1;
  const pageSize = 100;
  const base = `${OpenAPI.BASE.replace(/\/+$/, '')}/api/v1/public/articles/`;

  while (true) {
    const params = new URLSearchParams({
      ordering: '-published_at',
      page: String(page),
      page_size: String(pageSize),
    });
    if (filters.search?.trim()) params.set('search', filters.search.trim());
    if (filters.brand?.trim()) params.set('brand', filters.brand.trim());
    if (filters.productType) params.set('product_type', filters.productType);

    const res = await fetch(`${base}?${params.toString()}`, {
      credentials: 'omit',
      headers: await publicApiHeaders(),
    });
    if (!res.ok) break;

    const data = (await res.json()) as { results?: PublicArticleCard[]; next?: string | null };
    all.push(...(data.results ?? []));
    if (!data.next) break;
    page += 1;
  }

  return all.filter(isRenderableArticleCard);
}

/** Distinct brand names for article filter chips (from published products). */
export async function fetchArticleBrandOptions(
  productType?: ArticleProductTypeCode,
): Promise<string[]> {
  const base = `${OpenAPI.BASE.replace(/\/+$/, '')}/api/v1/public/products/brands/`;
  const url = productType ? `${base}?type=${productType}` : base;

  try {
    const res = await fetch(url, {
      credentials: 'omit',
      headers: await publicApiHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as
      | { type?: string; results?: string[] }
      | { results?: Record<string, string[]> };

    if (Array.isArray((data as { results?: string[] }).results)) {
      return (data as { results: string[] }).results;
    }

    const grouped = (data as { results?: Record<string, string[]> }).results ?? {};
    if (productType) {
      return grouped[productType] ?? [];
    }
    const brands = new Set<string>();
    for (const list of Object.values(grouped)) {
      for (const brand of list) {
        if (brand && brand.toUpperCase() !== 'N/A') brands.add(brand);
      }
    }
    return [...brands].sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

export type { ArticleListFilters, ArticleProductTypeCode };

export async function fetchArticleBySlugs(
  productSlug: string,
  articleSlug: string
): Promise<PublicProductArticle | null> {
  try {
    // Generated client arg order is (articleSlug, productSlug).
    return await ApiService.apiV1PublicProductsBySlugArticlesRetrieve(
      articleSlug,
      productSlug
    );
  } catch (e: unknown) {
    if (getErrorStatus(e) === 404) {
      try {
        return await ApiService.apiV1PublicArticlesRetrieve(articleSlug);
      } catch {
        return null;
      }
    }
    throw e;
  }
}

export async function fetchProductArticles(productSlug: string): Promise<PublicArticleCard[]> {
  try {
    const response = await ApiService.apiV1PublicProductsBySlugArticlesList(productSlug);
    return normalizeArticleList(
      response as PublicArticleCard[] | { results?: PublicArticleCard[] | null }
    );
  } catch (e: unknown) {
    if (getErrorStatus(e) === 404) return [];
    throw e;
  }
}

export function getArticleCardImageUrl(
  article: Pick<PublicArticleCard, 'thumbnail_image'> & { product_primary_image?: string | null }
): string {
  return article.thumbnail_image || article.product_primary_image || '';
}

export function resolveImageUrl(path?: string | null, fallback?: string) {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  return `${brandConfig.apiBaseUrl}${path}`;
}

export function resolveProductImage(product?: PublicProduct | null) {
  return resolveImageUrl(
    product?.primary_image,
    `${brandConfig.siteUrl}/affordable-social-share.png`
  ) as string;
}
