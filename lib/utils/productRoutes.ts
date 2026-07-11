import type { PublicProduct } from '@/lib/api/generated';

type ProductLike = Pick<PublicProduct, 'id' | 'slug'> | null | undefined;

interface ProductRouteOptions {
  fallbackId?: number | string | null;
  promotionId?: number | null;
}

/** Query params that create duplicate product URLs for crawlers. */
export const PRODUCT_SEO_STRIP_PARAMS = new Set([
  'pid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
]);

export function getProductHref(product?: ProductLike, options: ProductRouteOptions = {}): string {
  const slug = typeof product?.slug === 'string' ? product.slug.trim() : '';
  const id = product?.id ?? options.fallbackId ?? null;
  const idValue = typeof id === 'number' || typeof id === 'string' ? String(id) : '';
  // Prefer slug; fall back to numeric id only when slug is missing.
  const identifier = slug || idValue;
  const base = identifier ? `/products/${identifier}` : '/products';

  const params = new URLSearchParams();
  // Do not append pid — it creates crawlable duplicates of the canonical slug URL.
  if (typeof options.promotionId === 'number') {
    params.set('promotion', String(options.promotionId));
  }
  const query = params.toString();

  return query ? `${base}?${query}` : base;
}

export function buildProductQuerySuffix(
  searchParams: Record<string, string | string[] | undefined>,
  { stripSeoParams = true }: { stripSeoParams?: boolean } = {},
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (stripSeoParams && PRODUCT_SEO_STRIP_PARAMS.has(key)) {
      continue;
    }
    if (typeof value === 'string') {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry) {
          params.append(key, entry);
        }
      });
    }
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function productUrlHasStrippableSeoParams(
  searchParams: Record<string, string | string[] | undefined>,
): boolean {
  return Object.keys(searchParams).some((key) => PRODUCT_SEO_STRIP_PARAMS.has(key));
}
