/**
 * Persist add-to-cart intent across Google OAuth full-page redirects.
 * Email/password auth never leaves the page, so React state is enough there.
 */

export type PersistedPendingCartAdd =
  | {
      source: 'card';
      unitId: number;
      qty: number;
      unitPrice?: number;
      path: string;
    }
  | {
      source: 'pdp';
      pending:
        | { kind: 'unit'; quantity: number; promotionId?: number; unitPrice?: number }
        | { kind: 'bundle'; bundleId: number; bundleItemIds: number[] }
        | {
            kind: 'accessory';
            unitId: number;
            quantity: number;
            unitPrice?: number;
            accessoryName?: string;
          };
      selectedUnitId?: number | null;
      path: string;
    };

const STORAGE_KEY = 'pending_cart_add';

export function savePendingCartAdd(payload: PersistedPendingCartAdd): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadPendingCartAdd(): PersistedPendingCartAdd | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedPendingCartAdd;
  } catch {
    return null;
  }
}

export function clearPendingCartAdd(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function currentPathForPendingCart(): string {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}` || '/';
}
