import { brandConfig } from '@/lib/config/brand';
import { getCloudinaryFetchUrl } from '@/lib/utils/cloudinary';

/** Static WebP assets (see scripts/rasterize-trust-stamps.mjs). */
function trustStampPublicPath(condition: string | undefined | null): string | null {
  if (condition === 'N') return '/images/trust-stamps/new.webp';
  if (condition === 'R') return '/images/trust-stamps/refurbished.webp';
  if (condition === 'P') return '/images/trust-stamps/pre-owned.webp';
  return null;
}

/**
 * Relative URL for `<img src>` (local WebP). Prefer {@link getTrustStampImageUrl} for optional Cloudinary.
 */
export function getTrustStampSrc(condition: string | undefined | null): string | null {
  return trustStampPublicPath(condition);
}

/**
 * Image URL for trust stamps: local WebP by default; when `NEXT_PUBLIC_TRUST_STAMP_CLOUDINARY=1`,
 * uses Cloudinary fetch against the **canonical** site URL so size/format are applied at the edge.
 *
 * `pixelWidth` should reflect display CSS px × devicePixelRatio (e.g. 200 for ~100px wide @2x).
 */
export function getTrustStampImageUrl(
  condition: string | undefined | null,
  pixelWidth: number
): string | null {
  const path = trustStampPublicPath(condition);
  if (!path) return null;

  const useCloudinary =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TRUST_STAMP_CLOUDINARY === '1';
  if (!useCloudinary) {
    return path;
  }

  const base = brandConfig.siteUrl.replace(/\/+$/, '');
  const absolute = `${base}${path}`;
  return getCloudinaryFetchUrl(absolute, { width: pixelWidth, format: 'webp' });
}
