import type { PublicProduct } from '@/lib/api/generated';

type ProductLike = Pick<PublicProduct, 'id' | 'slug'> | null | undefined;

interface ProductRouteOptions {
  fallbackId?: number | string | null;
  promotionId?: number | null;
}

export function getProductHref(product?: ProductLike, options: ProductRouteOptions = {}): string {
  const slug = typeof product?.slug === 'string' ? product.slug.trim() : '';
  const id = product?.id ?? options.fallbackId ?? null;
  const idValue = typeof id === 'number' || typeof id === 'string' ? String(id) : '';
  const identifier = slug || idValue;
  const base = identifier ? `/products/${identifier}` : '/products';

  const params = new URLSearchParams();
  if (slug && idValue) {
    params.set('pid', idValue);
  }
  if (typeof options.promotionId === 'number') {
    params.set('promotion', String(options.promotionId));
  }
  const query = params.toString();

  return query ? `${base}?${query}` : base;
}
