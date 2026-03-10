'use client';

import Link from 'next/link';
import { ProductCarousel } from '@/components/ProductCarousel';

/**
 * Edit this list before pushing: set href and optionally image (path to logo).
 * Each item is 240×120px with progress bar and samsung-progressbar-arrows.
 */
const BRAND_ITEMS: { href: string; image?: string; label?: string }[] = [
  {
    href: '/products',
    image: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773054258/3_lbgh7q.png',
    label: 'Brand showcase 1',
  },
  {
    href: '/products',
    image: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773054258/5_ezh1ms.png',
    label: 'Brand showcase 2',
  },
  {
    href: '/products',
    image: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773054258/4_bmik5e.png',
    label: 'Brand showcase 3',
  },
  {
    href: '/products',
    image: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773054258/1_fvrjqp.png',
    label: 'Brand showcase 4',
  },
  {
    href: '/products',
    image: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773054257/2_ogrdnk.png',
    label: 'Brand showcase 5',
  },
];

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
        {BRAND_ITEMS.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="brand-carousel__item"
            aria-label={item.label ?? `Brand ${index + 1}`}
          >
            {item.image ? (
              <img
                src={item.image}
                alt=""
                width={480}
                height={240}
                className="brand-carousel__image"
              />
            ) : (
              <span className="brand-carousel__placeholder">
                {item.label ?? ''}
              </span>
            )}
          </Link>
        ))}
      </ProductCarousel>
    </div>
  );
}
