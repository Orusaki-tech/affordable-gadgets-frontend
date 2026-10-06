/** Normalized digits from localStorage customer_phone, if any. */
export function getSavedCustomerPhone(): string {
  if (typeof window === 'undefined') return '';
  return (localStorage.getItem('customer_phone') || '').replace(/\D/g, '');
}

/** True when we already have a usable phone for cart/lead flows. */
export function hasValidSavedCustomerPhone(): boolean {
  return getSavedCustomerPhone().length >= 9;
}
