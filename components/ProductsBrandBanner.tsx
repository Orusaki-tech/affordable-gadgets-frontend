'use client';

import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import type { ProductsBrandBannerConfig } from '@/lib/config/products-brand-banners';

type ProductsBrandBannerProps = {
  config: ProductsBrandBannerConfig;
};

export function ProductsBrandBanner({ config }: ProductsBrandBannerProps) {
  const label = config.imageAlt ?? `${config.title} collection`;

  const image = config.backgroundImage ? (
    <CloudinaryImage
      src={config.backgroundImage}
      alt={config.imageAlt ?? ''}
      preset="brandBanner"
      width={config.imageWidth}
      height={config.imageHeight}
      className="products-brand-banner__image"
      sizes="100vw"
      priority
    />
  ) : null;

  return (
    <section
      className="products-brand-banner"
      aria-label={label}
      style={
        config.backgroundColor ? { backgroundColor: config.backgroundColor } : undefined
      }
    >
      {config.href && image ? (
        <Link href={config.href} className="products-brand-banner__link" aria-label={label}>
          {image}
        </Link>
      ) : (
        image
      )}
    </section>
  );
}
