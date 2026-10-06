import { ApiService } from '@/lib/api/generated';
import {
  clearPendingCartClear,
  isPaidOrderStatus,
  loadPendingCartClear,
} from '@/lib/pendingCartClear';

/**
 * After a paid order is confirmed, delete the cart lines deferred at Pesapal redirect.
 */
export async function flushPendingCartClearForOrder(
  orderId: string,
  orderStatus?: string | null
): Promise<boolean> {
  if (!isPaidOrderStatus(orderStatus)) return false;
  const pending = loadPendingCartClear();
  if (!pending || pending.orderId !== orderId) return false;

  try {
    await Promise.all(
      pending.itemIds.map((itemId) =>
        ApiService.apiV1PublicCartItemsDestroy(pending.cartId, String(itemId))
      )
    );
  } catch (err) {
    console.warn('[CART] Failed to clear cart after paid order:', err);
  } finally {
    clearPendingCartClear();
  }
  return true;
}
