'use client';

import Image from 'next/image';
import { getTrustStampSrc } from '@/lib/utils/trustStamp';

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
  const src = getTrustStampSrc(condition);
  if (!src) return null;

  const label = labelForCondition(condition);
  const intrinsic = 256;

  return (
    <div
      className={`product-trust-stamp product-trust-stamp--${size}`}
      role="img"
      aria-label={label}
    >
      <Image
        src={src}
        alt={label}
        width={intrinsic}
        height={intrinsic}
        className="product-trust-stamp__img"
        sizes={size === 'detail' ? '(max-width: 640px) 72px, 92px' : '56px'}
      />
    </div>
  );
}
