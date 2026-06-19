import { permanentRedirect } from 'next/navigation';

export function permanentRedirectToCanonicalProductSlug(
  requestedSlug: string,
  canonicalSlug?: string | null,
  suffix = '',
) {
  const canonical = canonicalSlug?.trim();
  if (!canonical || canonical === requestedSlug) {
    return;
  }
  permanentRedirect(`/products/${canonical}${suffix}`);
}
