import { ApiService } from '@/lib/api/generated';
import type { PublicProduct, PublicProductArticle, PublicArticleCard } from '@/lib/api/generated';
import { brandConfig } from '@/lib/config/brand';

export const BLOG_REVALIDATE = 3600;

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
  search?: string,
  productSlug?: string
): Promise<PublicArticleCard[]> {
  const all: PublicArticleCard[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const response = await ApiService.apiV1PublicArticlesList(
      undefined,
      undefined,
      '-published_at',
      page,
      pageSize,
      undefined,
      productSlug,
      search,
    );
    all.push(...(response.results ?? []));
    if (!response.next) break;
    page += 1;
  }

  return all.filter(isRenderableArticleCard);
}

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
