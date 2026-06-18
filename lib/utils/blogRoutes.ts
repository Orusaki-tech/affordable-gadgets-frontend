export function getArticleHref(productSlug?: string | null, articleSlug?: string | null): string | null {
  if (!productSlug || !articleSlug) return null;
  return `/products/${productSlug}/blog/${articleSlug}`;
}
