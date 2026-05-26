'use client';

import type { ProductsBrandBannerConfig } from '@/lib/config/products-brand-banners';

const PRODUCTS_GRID_ID = 'products-grid';

export function scrollToProductsGrid() {
  document.getElementById(PRODUCTS_GRID_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

type ProductsBrandBannerProps = {
  config: ProductsBrandBannerConfig;
};

export function ProductsBrandBanner({ config }: ProductsBrandBannerProps) {
  const imageSrc = config.backgroundImage;

  return (
    <section
      className={`products-brand-banner${imageSrc ? ' products-brand-banner--split' : ''}`}
      aria-label={`${config.title} collection`}
    >
      <div className="products-brand-banner__copy">
        <h1 className="products-brand-banner__title">{config.title}</h1>
        <p className="products-brand-banner__subtitle">{config.subtitle}</p>
        {config.priceLine ? (
          <p className="products-brand-banner__price">{config.priceLine}</p>
        ) : null}
        <button
          type="button"
          className="products-brand-banner__cta"
          onClick={scrollToProductsGrid}
        >
          Buy Now
        </button>
      </div>
      {imageSrc ? (
        <div className="products-brand-banner__visual">
          <img
            src={imageSrc}
            alt=""
            className="products-brand-banner__image"
            decoding="async"
          />
        </div>
      ) : null}
    </section>
  );
}
