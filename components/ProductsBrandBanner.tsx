'use client';

import { CloudinaryImage } from '@/components/CloudinaryImage';
import type { ProductsBrandBannerConfig } from '@/lib/config/products-brand-banners';

type ProductsBrandBannerProps = {
  config: ProductsBrandBannerConfig;
};

export function ProductsBrandBanner({ config }: ProductsBrandBannerProps) {
  const label = config.imageAlt ?? `${config.title} collection`;

  return (
    <section
      className="products-brand-banner"
      aria-label={label}
      style={
        config.backgroundColor ? { backgroundColor: config.backgroundColor } : undefined
      }
    >
      {config.backgroundImage ? (
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
      ) : null}
    </section>
  );
}
