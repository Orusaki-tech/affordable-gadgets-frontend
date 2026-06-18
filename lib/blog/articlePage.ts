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

export async function fetchArticleBySlugs(
  productSlug: string,
  articleSlug: string
): Promise<PublicProductArticle | null> {
  try {
    return await ApiService.apiV1PublicProductsBySlugArticlesRetrieve(productSlug, articleSlug);
  } catch (e: unknown) {
    const status =
      typeof e === 'object' && e !== null && 'status' in e
        ? (e as { status?: number }).status
        : undefined;
    if (status === 404) return null;
    throw e;
  }
}

export async function fetchProductArticles(productSlug: string): Promise<PublicArticleCard[]> {
  try {
    const response = await ApiService.apiV1PublicProductsBySlugArticlesList(productSlug);
    return response.results ?? [];
  } catch (e: unknown) {
    const status =
      typeof e === 'object' && e !== null && 'status' in e
        ? (e as { status?: number }).status
        : undefined;
    if (status === 404) return [];
    throw e;
  }
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
