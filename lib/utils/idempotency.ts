/**
 * Idempotency utilities for order creation
 */

/**
 * Generate a unique idempotency key for order creation
 * Format: timestamp-randomString
 */
export function generateIdempotencyKey(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

function stableOrderFingerprint(orderData: any): string {
  const items = (orderData?.order_items || [])
    .map((item: any) => ({
      inventory_unit_id: item.inventory_unit_id ?? item.inventory_unit ?? null,
      variant_id: item.variant_id ?? item.variant ?? null,
      quantity: item.quantity ?? 1,
    }))
    .sort((a: any, b: any) => {
      const left = `${a.inventory_unit_id ?? ''}:${a.variant_id ?? ''}:${a.quantity}`;
      const right = `${b.inventory_unit_id ?? ''}:${b.variant_id ?? ''}:${b.quantity}`;
      return left.localeCompare(right);
    });

  return JSON.stringify({
    items,
    customer_phone: String(orderData?.customer_phone || '').trim(),
    customer_email: String(orderData?.customer_email || '').trim().toLowerCase(),
    fulfillment_method: String(orderData?.fulfillment_method || '').trim().toUpperCase(),
    delivery_county: String(orderData?.delivery_county || '').trim().toLowerCase(),
    delivery_ward: String(orderData?.delivery_ward || '').trim().toLowerCase(),
    delivery_address: String(orderData?.delivery_address || '').trim().toLowerCase(),
    order_source: String(orderData?.order_source || '').trim().toUpperCase(),
  });
}

/**
 * Drop a stored idempotency key (e.g. after a 409 payload mismatch).
 */
export function clearIdempotencyKey(orderData: any): void {
  if (typeof window === 'undefined') return;
  try {
    const orderHash = stableOrderFingerprint(orderData);
    const storageKey = `idempotency_${btoa(orderHash).substring(0, 50)}`;
    sessionStorage.removeItem(storageKey);
  } catch {
    /* ignore */
  }
}

/**
 * Get or create idempotency key for a specific order request
 * Uses sessionStorage to persist key across page refreshes/retries
 */
export function getIdempotencyKey(orderData: any): string {
  if (typeof window === 'undefined') {
    return generateIdempotencyKey();
  }

  // Hash must cover delivery/fulfillment so county/ward changes get a new key.
  const orderHash = stableOrderFingerprint(orderData);
  const storageKey = `idempotency_${btoa(orderHash).substring(0, 50)}`;
  const existingKey = sessionStorage.getItem(storageKey);

  if (existingKey) {
    return existingKey;
  }

  const newKey = generateIdempotencyKey();
  sessionStorage.setItem(storageKey, newKey);
  return newKey;
}
