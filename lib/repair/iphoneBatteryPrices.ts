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

/** Canonical keys so "iPhone 12" does not collide with "iPhone 12 Pro" / Mini. */
export function iphoneModelKey(name: string): string | null {
  const n = name.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!/\biphone\b/.test(n)) return null;

  const cleaned = n
    .replace(
      /\b(e-?sim|sim|active|desert|black|orange|silver\/?blue|white\/?gold|blue\/?black|2 year warranty)\b/g,
      ' '
    )
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Prefer longer letter gens (xr/xs) before bare x.
  const match = cleaned.match(
    /^iphone (se(?: \d+(?:rd|th|nd|st)? gen)?|xr|xs|x|air|\d+[a-z]?)(?: (pro max|pro|plus|mini|max))?/
  );
  if (!match) return null;
  const gen = match[1].replace(/\s+/g, '');
  const variant = (match[2] || '').replace(/\s+/g, '');
  return variant ? `iphone-${gen}-${variant}` : `iphone-${gen}`;
}

/** Match a free-text model to a listed iPhone battery price (case-insensitive). */
export function findIphoneBatteryPrice(model: string): IphoneBatteryPrice | null {
  const keyed = model.match(/iphone/i) ? model : `iPhone ${model}`;
  const key = iphoneModelKey(keyed);
  if (key) {
    const byKey = IPHONE_BATTERY_REPLACEMENT_PRICES.find(
      (row) => iphoneModelKey(row.model) === key
    );
    if (byKey) return byKey;
  }
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

export type CatalogImageSource = {
  product_name?: string | null;
  primary_image?: string | null;
};

/** Pick the best catalog product image for a listed battery model. */
export function findCatalogImageForBatteryModel(
  model: string,
  products: CatalogImageSource[]
): string | null {
  const target = iphoneModelKey(model);
  if (!target) return null;

  for (const product of products) {
    const image = product.primary_image || null;
    if (!image) continue;
    const key = iphoneModelKey(product.product_name || '');
    if (key === target) return image;
  }
  return null;
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
