'use client';

import { CloudinaryImage } from '@/components/CloudinaryImage';
import type { ProductsBrandBannerConfig } from '@/lib/config/products-brand-banners';
import {
  getCloudinaryBannerImageUrl,
  getCloudinaryWidthSrcSet,
  isCloudinaryUrl,
} from '@/lib/utils/cloudinary';

const PRODUCTS_GRID_ID = 'products-grid';

export function scrollToProductsGrid() {
  document.getElementById(PRODUCTS_GRID_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

type ProductsBrandBannerProps = {
  config: ProductsBrandBannerConfig;
};

function ResponsiveBrandBannerImage({
  mobile,
  tablet,
  alt,
}: {
  mobile: string;
  tablet: string;
  alt: string;
}) {
  const mobileWidths = [400, 800, 1024];
  const tabletWidths = [768, 1024, 1536, 2048];
  const tabletFallback = getCloudinaryBannerImageUrl(tablet, 1280, undefined, undefined, 'contain');

  return (
    <picture className="products-brand-banner__picture">
      <source
        media="(max-width: 767px)"
        srcSet={
          isCloudinaryUrl(mobile)
            ? getCloudinaryWidthSrcSet(mobile, mobileWidths, 'contain')
            : mobile
        }
        sizes="100vw"
      />
      <source
        media="(min-width: 768px)"
        srcSet={
          isCloudinaryUrl(tablet)
            ? getCloudinaryWidthSrcSet(tablet, tabletWidths, 'contain')
            : tablet
        }
        sizes="(min-width: 768px) 70vw, 1280px"
      />
      <img
        src={isCloudinaryUrl(tablet) ? tabletFallback : tablet}
        alt={alt}
        className="products-brand-banner__image"
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
    </picture>
  );
}

export function ProductsBrandBanner({ config }: ProductsBrandBannerProps) {
  const images = config.backgroundImages;

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
      {images ? (
        <ResponsiveBrandBannerImage
          mobile={images.mobile}
          tablet={images.tablet}
          alt={images.alt}
        />
      ) : config.backgroundImage ? (
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
