import type { PublicProduct } from '@/lib/api/generated';

const STORAGE_KEY = 'productDetailPlaceholder';

function getPlaceholderKey(slugOrId: string): string {
  return `${STORAGE_KEY}:${slugOrId}`;
}

/** Store list product for instant detail display (e.g. when user clicks a product card). */
export function setProductDetailPlaceholder(product: PublicProduct): void {
  if (typeof window === 'undefined') return;
  const key = product.slug?.trim() || (product.id != null ? String(product.id) : '');
  if (!key) return;
  try {
    sessionStorage.setItem(getPlaceholderKey(key), JSON.stringify(product));
  } catch {
    // ignore quota / private mode
  }
}

/** Read and clear stored placeholder for this slug/id. Use as placeholderFromList in detail hooks. */
export function getAndClearProductDetailPlaceholder(slugOrId: string): PublicProduct | undefined {
  if (typeof window === 'undefined') return undefined;
  const key = getPlaceholderKey(slugOrId);
  try {
    const raw = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    if (!raw) return undefined;
    return JSON.parse(raw) as PublicProduct;
  } catch {
    return undefined;
  }
}
