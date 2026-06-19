import { permanentRedirect } from 'next/navigation';
import { productPath } from '@/lib/seo/urls';

export function permanentRedirectToCanonicalProductSlug(
  requestedSlug: string,
  canonicalSlug?: string | null,
  suffix = '',
) {
  const canonical = canonicalSlug?.trim();
  if (!canonical || canonical === requestedSlug) {
    return;
  }
  permanentRedirect(`${productPath(canonical)}${suffix}`);
}
