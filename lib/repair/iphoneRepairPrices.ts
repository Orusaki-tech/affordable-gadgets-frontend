/** Listed iPhone repair prices (KSh) for the /repair page. */

export type IphoneRepairService = 'battery' | 'screen';

export type IphoneRepairPrice = {
  model: string;
  priceKes: number;
};

export const IPHONE_BATTERY_REPLACEMENT_PRICES: readonly IphoneRepairPrice[] = [
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

/** Screen replacement prices — populate when the price list is provided. */
export const IPHONE_SCREEN_REPLACEMENT_PRICES: readonly IphoneRepairPrice[] = [] as const;

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

  const match = cleaned.match(
    /^iphone (se(?: \d+(?:rd|th|nd|st)? gen)?|xr|xs|x|air|\d+[a-z]?)(?: (pro max|pro|plus|mini|max))?/
  );
  if (!match) return null;
  const gen = match[1].replace(/\s+/g, '');
  const variant = (match[2] || '').replace(/\s+/g, '');
  return variant ? `iphone-${gen}-${variant}` : `iphone-${gen}`;
}

function findInList(
  model: string,
  list: readonly IphoneRepairPrice[]
): IphoneRepairPrice | null {
  const keyed = model.match(/iphone/i) ? model : `iPhone ${model}`;
  const key = iphoneModelKey(keyed);
  if (key) {
    const byKey = list.find((row) => iphoneModelKey(row.model) === key);
    if (byKey) return byKey;
  }
  const q = model.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!q) return null;
  const exact = list.find((row) => row.model.toLowerCase() === q);
  if (exact) return exact;
  const withoutIphone = q.replace(/^iphone\s*/, '');
  return (
    list.find((row) => row.model.toLowerCase().replace(/^iphone\s*/, '') === withoutIphone) ??
    null
  );
}

export function findIphoneBatteryPrice(model: string): IphoneRepairPrice | null {
  return findInList(model, IPHONE_BATTERY_REPLACEMENT_PRICES);
}

export function findIphoneScreenPrice(model: string): IphoneRepairPrice | null {
  return findInList(model, IPHONE_SCREEN_REPLACEMENT_PRICES);
}

export function findIphoneRepairPrice(
  model: string,
  service: IphoneRepairService
): IphoneRepairPrice | null {
  return service === 'screen' ? findIphoneScreenPrice(model) : findIphoneBatteryPrice(model);
}

export type CatalogImageSource = {
  product_name?: string | null;
  primary_image?: string | null;
};

/** Pick the best catalog product image for a listed repair model. */
export function findCatalogImageForRepairModel(
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

/** @deprecated use findCatalogImageForRepairModel */
export const findCatalogImageForBatteryModel = findCatalogImageForRepairModel;

export function repairBookingHref(
  model: string,
  service: IphoneRepairService = 'battery'
): string {
  const issue = service === 'screen' ? 'Cracked / damaged screen' : 'Battery replacement';
  const params = new URLSearchParams({
    deviceType: 'Phone',
    brand: 'Apple',
    issue,
    model,
  });
  return `/repair?${params.toString()}#repair-request`;
}

export function repairBatteryBookingHref(model: string): string {
  return repairBookingHref(model, 'battery');
}
