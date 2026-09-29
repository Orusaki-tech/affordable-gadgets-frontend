/** Listed iPhone battery replacement prices (KSh) for the /repair page. */
export type IphoneBatteryPrice = {
  model: string;
  priceKes: number;
};

export const IPHONE_BATTERY_REPLACEMENT_PRICES: readonly IphoneBatteryPrice[] = [
  { model: 'iPhone X', priceKes: 4000 },
  { model: 'iPhone XR', priceKes: 4500 },
  { model: 'iPhone XS', priceKes: 4500 },
  { model: 'iPhone XS Max', priceKes: 5000 },
  { model: 'iPhone 11', priceKes: 5000 },
  { model: 'iPhone 11 Pro', priceKes: 6500 },
  { model: 'iPhone 11 Pro Max', priceKes: 6500 },
  { model: 'iPhone 12 Mini', priceKes: 6500 },
  { model: 'iPhone 12', priceKes: 6500 },
  { model: 'iPhone 12 Pro', priceKes: 6500 },
  { model: 'iPhone 12 Pro Max', priceKes: 6500 },
  { model: 'iPhone 13 Mini', priceKes: 6500 },
  { model: 'iPhone 13', priceKes: 6500 },
  { model: 'iPhone 13 Pro', priceKes: 7500 },
  { model: 'iPhone 13 Pro Max', priceKes: 7500 },
  { model: 'iPhone 14', priceKes: 7500 },
  { model: 'iPhone 14 Plus', priceKes: 7500 },
  { model: 'iPhone 14 Pro', priceKes: 8000 },
  { model: 'iPhone 14 Pro Max', priceKes: 8500 },
  { model: 'iPhone 15', priceKes: 8000 },
  { model: 'iPhone 15 Plus', priceKes: 8000 },
  { model: 'iPhone 15 Pro', priceKes: 9500 },
  { model: 'iPhone 15 Pro Max', priceKes: 9500 },
  { model: 'iPhone 16', priceKes: 8500 },
  { model: 'iPhone 16 Plus', priceKes: 9500 },
  { model: 'iPhone 16 Pro', priceKes: 15500 },
  { model: 'iPhone 16 Pro Max', priceKes: 20000 },
] as const;

export function formatRepairKes(amount: number): string {
  return `KSh ${Math.round(amount).toLocaleString('en-KE')}`;
}

/** Match a free-text model to a listed iPhone battery price (case-insensitive). */
export function findIphoneBatteryPrice(model: string): IphoneBatteryPrice | null {
  const q = model.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!q) return null;
  const exact = IPHONE_BATTERY_REPLACEMENT_PRICES.find(
    (row) => row.model.toLowerCase() === q
  );
  if (exact) return exact;
  const withoutIphone = q.replace(/^iphone\s*/, '');
  return (
    IPHONE_BATTERY_REPLACEMENT_PRICES.find((row) => {
      const short = row.model.toLowerCase().replace(/^iphone\s*/, '');
      return short === withoutIphone;
    }) ?? null
  );
}

export function repairBatteryBookingHref(model: string): string {
  const params = new URLSearchParams({
    deviceType: 'Phone',
    brand: 'Apple',
    issue: 'Battery replacement',
    model,
  });
  return `/repair?${params.toString()}#repair-request`;
}
