'use client';

import Link from 'next/link';

/**
 * Edit this list before pushing: set href and optionally image (path to logo).
 * Each item is a 70×120px rectangle in the carousel.
 * Order: last item is followed by the first (seamless loop).
 */
const BRAND_ITEMS: { href: string; image?: string; label?: string }[] = [
  { href: '/products', label: '1' },
  { href: '/products', label: '2' },
  { href: '/products', label: '3' },
  { href: '/products', label: '4' },
  { href: '/products', label: '5' },
];

export function BrandCarousel() {
  // Rotate so last is followed by first, then duplicate for seamless infinite scroll
  const rotated = [
    ...BRAND_ITEMS.slice(-1),
    ...BRAND_ITEMS.slice(0, -1),
  ];
  const items = [...rotated, ...rotated];

  return (
    <div className="brand-carousel" aria-label="Brands">
      <div className="brand-carousel__track">
        {items.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="brand-carousel__item"
            style={{ width: 70, height: 120, minWidth: 70, minHeight: 120 }}
            aria-label={item.label ?? `Brand ${index + 1}`}
          >
            {item.image ? (
              <img
                src={item.image}
                alt=""
                width={70}
                height={120}
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
