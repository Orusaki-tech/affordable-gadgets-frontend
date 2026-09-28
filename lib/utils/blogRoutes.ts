import { studioPath } from '@/lib/studio/paths';

export function getArticleHref(productSlug?: string | null, articleSlug?: string | null): string | null {
  if (!articleSlug) return null;
  const href = !productSlug ? `/blog/${articleSlug}` : `/products/${productSlug}/blog/${articleSlug}`;
  return studioPath(href);
}
