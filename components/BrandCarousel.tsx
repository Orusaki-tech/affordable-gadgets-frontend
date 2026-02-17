'use client';

import Link from 'next/link';

/**
 * Edit this list before pushing: set href and optionally image (path to logo).
 * Each item is a 100×50px rectangle in the carousel.
 */
const BRAND_ITEMS: { href: string; image?: string; label?: string }[] = [
  { href: '/products', label: '1' },
  { href: '/products', label: '2' },
  { href: '/products', label: '3' },
  { href: '/products', label: '4' },
  { href: '/products', label: '5' },
];

export function BrandCarousel() {
  const items = [...BRAND_ITEMS, ...BRAND_ITEMS];

  return (
    <div className="brand-carousel" aria-label="Brands">
      <div className="brand-carousel__track">
        {items.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="brand-carousel__item"
            style={{ width: 100, height: 50, minWidth: 100, minHeight: 50 }}
            aria-label={item.label ?? `Brand ${index + 1}`}
          >
            {item.image ? (
              <img
                src={item.image}
                alt=""
                width={100}
                height={50}
                className="brand-carousel__image"
              />
            ) : (
              <span className="brand-carousel__placeholder">{item.label ?? ''}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
