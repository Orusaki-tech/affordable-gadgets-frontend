import { brandConfig } from '@/lib/config/brand';

const trimBase = () => brandConfig.siteUrl.replace(/\/+$/, '');

export function productPath(slug: string) {
  return `/products/${slug.trim()}`;
}

export function productUrl(slug: string) {
  return `${trimBase()}${productPath(slug)}`;
}

export function articlePath(productSlug: string, articleSlug: string) {
  return `/products/${productSlug.trim()}/blog/${articleSlug.trim()}`;
}

export function articleUrl(productSlug: string, articleSlug: string) {
  return `${trimBase()}${articlePath(productSlug, articleSlug)}`;
}

export function resolveCanonicalProductSlug(requestedSlug: string, productSlug?: string | null) {
  return productSlug?.trim() || requestedSlug.trim();
}
