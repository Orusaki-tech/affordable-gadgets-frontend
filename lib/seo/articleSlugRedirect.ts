import { permanentRedirect } from 'next/navigation';
import { articlePath } from '@/lib/seo/urls';

export function permanentRedirectToCanonicalArticleSlug(
  productSlug: string,
  requestedArticleSlug: string,
  canonicalArticleSlug?: string | null,
) {
  const canonical = canonicalArticleSlug?.trim();
  if (!canonical || canonical === requestedArticleSlug) {
    return;
  }
  permanentRedirect(articlePath(productSlug, canonical));
}
