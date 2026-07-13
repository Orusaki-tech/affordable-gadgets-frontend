export function getArticleHref(productSlug?: string | null, articleSlug?: string | null): string | null {
  if (!articleSlug) return null;
  if (!productSlug) return `/blog/${articleSlug}`;
  return `/products/${productSlug}/blog/${articleSlug}`;
}
