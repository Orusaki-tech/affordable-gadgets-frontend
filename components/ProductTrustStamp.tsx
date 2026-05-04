'use client';

import { getTrustStampImageUrl } from '@/lib/utils/trustStamp';

type ProductTrustStampProps = {
  condition: string | undefined | null;
  size: 'detail' | 'card';
};

function labelForCondition(condition: string | undefined | null): string {
  if (condition === 'N') return 'New — authentic, sealed, full warranty';
  if (condition === 'R') return 'Refurbished — repaired, tested, guaranteed';
  if (condition === 'P') return 'Pre-owned — vetted and checked';
  return 'Product condition';
}

export function ProductTrustStamp({ condition, size }: ProductTrustStampProps) {
  const pixelWidth = size === 'detail' ? 220 : 140;
  const src = getTrustStampImageUrl(condition, pixelWidth);
  if (!src) return null;

  const label = labelForCondition(condition);

  return (
    <div
      className={`product-trust-stamp product-trust-stamp--${size}`}
      role="img"
      aria-label={label}
    >
      <img src={src} alt={label} className="product-trust-stamp__img" decoding="async" />
    </div>
  );
}
