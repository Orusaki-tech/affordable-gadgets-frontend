/**
 * Defer cart line deletion until payment is confirmed (not on Pesapal redirect).
 * Survives the full-page redirect to Pesapal and back.
 */

export type PendingCartClear = {
  cartId: number;
  itemIds: number[];
  orderId: string;
};

const STORAGE_KEY = 'pending_cart_clear';

export function savePendingCartClear(payload: PendingCartClear): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function loadPendingCartClear(): PendingCartClear | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingCartClear;
  } catch {
    return null;
  }
}

export function clearPendingCartClear(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function isPaidOrderStatus(status?: string | null): boolean {
  const normalized = String(status || '').trim().toUpperCase();
  return ['PAID', 'DELIVERED', 'COMPLETED', 'SUCCESS', 'SUCCEEDED'].includes(normalized);
}
