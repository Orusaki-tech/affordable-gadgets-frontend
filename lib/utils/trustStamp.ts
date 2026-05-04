/** Inventory condition codes (see ProductDetail CONDITION_CHIP_DEFINITIONS). */
export function getTrustStampSrc(condition: string | undefined | null): string | null {
  if (condition === 'N') return '/images/trust-stamps/new.png';
  if (condition === 'R') return '/images/trust-stamps/refurbished.png';
  if (condition === 'P') return '/images/trust-stamps/pre-owned.png';
  return null;
}
