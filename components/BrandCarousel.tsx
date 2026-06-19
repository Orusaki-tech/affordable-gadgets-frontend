'use client';

import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { ProductCarousel } from '@/components/ProductCarousel';
import {
  PRIMARY_BRAND_NAV,
  brandCategoryHref,
} from '@/lib/config/nav-links';

/** Optional logo per flagship brand; others render as text placeholders. */
const BRAND_IMAGES: Partial<Record<string, string>> = {
  Apple:
    'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773054258/3_lbgh7q.png',
  Samsung:
    'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773054258/5_ezh1ms.png',
  Google:
    'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773054258/4_bmik5e.png',
  OnePlus:
    'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773054258/1_fvrjqp.png',
  Xiaomi:
    'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773054257/2_ogrdnk.png',
};

const BRAND_ITEMS = PRIMARY_BRAND_NAV.map((brand) => ({
  href: brandCategoryHref(brand.brandFilter, null),
  label: brand.navLabel,
  image: BRAND_IMAGES[brand.navLabel],
}));

export function BrandCarousel() {
  return (
    <div className="brand-carousel" aria-label="Brands">
      <ProductCarousel
        itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
        showNavigation
        alwaysShowNavigation
        showPagination={false}
        autoPlay
        className="brand-carousel__carousel"
      >
        {BRAND_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="brand-carousel__item"
            aria-label={`Shop ${item.label}`}
          >
            {item.image ? (
              <CloudinaryImage
                src={item.image}
                alt=""
                preset="logo"
                width={480}
                height={240}
                className="brand-carousel__image"
              />
            ) : (
              <span className="brand-carousel__placeholder">{item.label}</span>
            )}
          </Link>
        ))}
      </ProductCarousel>
    </div>
  );
}
