'use client';

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';

const ITEM_WIDTH = 240;
const GAP = 16;
const SCROLL_STEP = ITEM_WIDTH + GAP;

/**
 * Edit this list before pushing: set href and optionally image (path to logo).
 * Each item is 240×120px with progress bar and samsung-progressbar-arrows.
 */
const BRAND_ITEMS: { href: string; image?: string; label?: string }[] = [
  { href: '/products', label: '1' },
  { href: '/products', label: '2' },
  { href: '/products', label: '3' },
  { href: '/products', label: '4' },
  { href: '/products', label: '5' },
];

export function BrandCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [progressPercent, setProgressPercent] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setHasOverflow(maxScroll > 2);
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < maxScroll - 2);
    const pct = maxScroll > 0 ? (el.scrollLeft / maxScroll) * 100 : 100;
    setProgressPercent(pct);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateButtons();
    el.addEventListener('scroll', updateButtons);
    window.addEventListener('resize', updateButtons);
    return () => {
      el.removeEventListener('scroll', updateButtons);
      window.removeEventListener('resize', updateButtons);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -SCROLL_STEP : SCROLL_STEP;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="brand-carousel" aria-label="Brands">
      <div
        ref={scrollRef}
        className="brand-carousel__scroll"
        role="region"
        aria-label="Brand carousel"
      >
        <div className="brand-carousel__track">
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
                  width={240}
                  height={120}
                  className="brand-carousel__image"
                />
              ) : (
                <span className="brand-carousel__placeholder">
                  {item.label ?? ''}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {hasOverflow && (
        <div className="samsung-progressbar">
          <div className="samsung-progressbar-inner">
            <div className="samsung-progressbar-bar">
              <span
                className="samsung-progressbar-fill"
                style={{
                  transform: `scaleX(${progressPercent / 100})`,
                  transitionDuration: '300ms',
                }}
              />
            </div>
            <div className="samsung-progressbar-arrows">
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className="samsung-progressbar-arrow"
                aria-label="Previous brands"
                aria-disabled={!canScrollLeft}
              >
                <span className="sr-only">Previous</span>
                <svg className="samsung-progressbar-icon" focusable="false" aria-hidden="true" viewBox="0 0 40 40">
                  <g transform="translate(40 40) rotate(180)">
                    <path d="M21.47,16.53A.75.75,0,0,1,22.53,15.47l4,4a.75.75,0,0,1,0,1.061l-4,4A.75.75,0,0,1,21.47,23.47l2.72-2.72H14.5a.75.75,0,0,1,0-1.5h9.689Z" />
                  </g>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className="samsung-progressbar-arrow"
                aria-label="Next brands"
                aria-disabled={!canScrollRight}
              >
                <span className="sr-only">Next</span>
                <svg className="samsung-progressbar-icon" focusable="false" aria-hidden="true" viewBox="0 0 40 40">
                  <path d="M21.47,16.53A.75.75,0,0,1,22.53,15.47l4,4a.75.75,0,0,1,0,1.061l-4,4A.75.75,0,0,1,21.47,23.47l2.72-2.72H14.5a.75.75,0,0,1,0-1.5h9.689Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
