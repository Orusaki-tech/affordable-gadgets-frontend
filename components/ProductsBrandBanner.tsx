'use client';

import { CloudinaryImage } from '@/components/CloudinaryImage';
import type { ProductsBrandBannerConfig } from '@/lib/config/products-brand-banners';

const PRODUCTS_GRID_ID = 'products-grid';

export function scrollToProductsGrid() {
  document.getElementById(PRODUCTS_GRID_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

type ProductsBrandBannerProps = {
  config: ProductsBrandBannerConfig;
};

export function ProductsBrandBanner({ config }: ProductsBrandBannerProps) {
  return (
    <section className="products-brand-banner" aria-label={`${config.title} collection`}>
      <div className="products-brand-banner__content">
        <h1 className="products-brand-banner__title">{config.title}</h1>
        <p className="products-brand-banner__subtitle">{config.subtitle}</p>
        <button
          type="button"
          className="products-brand-banner__cta"
          onClick={scrollToProductsGrid}
        >
          Buy Now
        </button>
      </div>
      {config.backgroundImage ? (
        <CloudinaryImage
          src={config.backgroundImage}
          alt=""
          preset="hero"
          className="products-brand-banner__image"
          pictureClassName="products-brand-banner__picture"
          sizes="(max-width: 768px) 100vw, 1280px"
        />
      ) : null}
    </section>
  );
}
