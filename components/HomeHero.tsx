'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { PaginatedPublicPromotionList, PublicPromotion } from '@/lib/api/generated';
import { usePromotions } from '@/lib/hooks/usePromotions';
import { useProducts } from '@/lib/hooks/useProducts';
import { ProductCard } from '@/components/ProductCard';
import { ProductCarousel } from '@/components/ProductCarousel';
import { getCloudinarySizedImageUrl } from '@/lib/utils/cloudinary';
import { getProductHref } from '@/lib/utils/productRoutes';

const PROMOTIONS_PAGE_SIZE = 50;
const PROMO_THUMB_SIZE = 320;
const HERO_BANNER_SIZE = 1400;
/** Number of placeholder/skeleton cards when there are no hero promotions (keep 4 visible to match itemsPerView). */
const HERO_PLACEHOLDER_COUNT = 4;

function normalizeLocations(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function sortPromotions(promotions: PublicPromotion[]) {
  return [...promotions].sort((a, b) => {
    const aPos = a.carousel_position;
    const bPos = b.carousel_position;
    const aHasPos = typeof aPos === 'number';
    const bHasPos = typeof bPos === 'number';

    if (aHasPos && bHasPos) return aPos - bPos;
    if (aHasPos) return -1;
    if (bHasPos) return 1;

    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });
}

function getPromotionHref(promotion: PublicPromotion): string {
  const promotionId = typeof promotion.id === 'number' ? promotion.id : null;
  const firstProductId = Array.isArray(promotion.products) ? promotion.products[0] : null;

  if (firstProductId) {
    return getProductHref(undefined, { fallbackId: firstProductId, promotionId });
  }
  if (promotionId) {
    return `/products?promotion=${promotionId}`;
  }
  return '/products';
}

export function HomeHero() {
  const { data: promotionsData, isLoading: promosLoading } = usePromotions({
    page_size: PROMOTIONS_PAGE_SIZE,
  });

  const promotions = useMemo(() => {
    const results = (promotionsData as PaginatedPublicPromotionList | undefined)?.results ?? [];

    const featuredForHero = (results as PublicPromotion[]).filter((promo) => {
      const locations = normalizeLocations((promo as any).display_locations);
      return locations.length > 0 && locations.includes('homepage_hero');
    });

    const baseList =
      featuredForHero.length > 0 ? featuredForHero : (results as PublicPromotion[]);

    return sortPromotions(baseList);
  }, [promotionsData]);

  const [activePromotionId, setActivePromotionId] = useState<number | null>(null);

  useEffect(() => {
    if (activePromotionId !== null) return;
    const firstId = promotions[0]?.id;
    if (typeof firstId === 'number') setActivePromotionId(firstId);
  }, [activePromotionId, promotions]);

  const activePromotion = useMemo(() => {
    if (!promotions.length) return null;
    if (activePromotionId === null) return promotions[0] ?? null;
    return promotions.find((p) => p.id === activePromotionId) ?? promotions[0] ?? null;
  }, [activePromotionId, promotions]);

  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const normalizedQuery = submittedQuery.trim();
  const searchEnabled = normalizedQuery.length >= 2;

  const { data: productsData, isLoading: productsLoading } = useProducts({
    search: searchEnabled ? normalizedQuery : undefined,
    page_size: 1,
    enabled: searchEnabled,
  });
  const product = productsData?.results?.[0] ?? null;

  const activeBannerSrc =
    activePromotion?.banner_image_url || activePromotion?.banner_image || null;

  const carouselContent: ReactNode[] = promosLoading && promotions.length === 0
    ? Array.from({ length: HERO_PLACEHOLDER_COUNT }).map((_, i) => (
        <div key={i} className="home-hero__promo-skeleton" />
      ))
    : promotions.length > 0
      ? promotions.map((promotion) => {
          const id = typeof promotion.id === 'number' ? promotion.id : null;
          const isActive = id !== null && id === activePromotionId;
          const thumbSrc = promotion.banner_image_url || promotion.banner_image || null;
          return (
            <button
              key={id ?? promotion.title}
              type="button"
              className={`home-hero__promo-card ${isActive ? 'home-hero__promo-card--active' : ''}`}
              onMouseEnter={() => { if (id !== null) setActivePromotionId(id); }}
              onFocus={() => { if (id !== null) setActivePromotionId(id); }}
              onClick={() => { if (id !== null) setActivePromotionId(id); }}
              aria-pressed={isActive}
            >
              <div className="home-hero__promo-media">
                {thumbSrc ? (
                  <Image
                    src={getCloudinarySizedImageUrl(thumbSrc, PROMO_THUMB_SIZE, 'contain')}
                    alt={promotion.title}
                    width={PROMO_THUMB_SIZE}
                    height={PROMO_THUMB_SIZE}
                    className="home-hero__promo-image"
                    unoptimized={thumbSrc.includes('localhost') || thumbSrc.includes('127.0.0.1') || thumbSrc.includes('placehold.co')}
                  />
                ) : (
                  <div className="home-hero__promo-image home-hero__promo-image--placeholder" />
                )}
              </div>
              <div className="home-hero__promo-info">
                <p className="home-hero__promo-title">{promotion.title}</p>
                {promotion.discount_display ? (
                  <p className="home-hero__promo-subtitle">{promotion.discount_display}</p>
                ) : promotion.description ? (
                  <p className="home-hero__promo-subtitle">{promotion.description}</p>
                ) : (
                  <p className="home-hero__promo-subtitle">View offer</p>
                )}
              </div>
            </button>
          );
        })
      : Array.from({ length: HERO_PLACEHOLDER_COUNT }).map((_, index) => (
          <div key={index} className="home-hero__promo-empty-card" aria-label="Promotions coming soon">
            <div className="home-hero__promo-empty-media" />
            <div className="home-hero__promo-empty-body">
              <p className="home-hero__promo-empty-title">Coming soon</p>
              <p className="home-hero__promo-empty-copy">
                Future deals and stories will appear here.
              </p>
            </div>
          </div>
        ));

  return (
    <section className="home-hero" aria-label="Homepage hero">
      <div className="home-hero__container">
        {/* Single grid: row1 = track (full width), row2 = nav (left) | banner (right), row3 = search (left), row4 = card (left) */}
        <div className="home-hero__main-grid" aria-label="Promotions">
          <ProductCarousel
            itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
            showNavigation
            alwaysShowNavigation
            splitNav
            showPagination={false}
            autoPlay={false}
            className="home-hero__promo-carousel"
          >
            {...carouselContent}
          </ProductCarousel>

          <div className="home-hero__right">
            {activePromotion && activeBannerSrc ? (
              <Link href={getPromotionHref(activePromotion)} className="home-hero__banner" aria-label={activePromotion.title}>
                <Image
                  src={getCloudinarySizedImageUrl(activeBannerSrc, HERO_BANNER_SIZE, 'cover')}
                  alt={activePromotion.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="home-hero__banner-image"
                  priority
                  unoptimized={activeBannerSrc.includes('localhost') || activeBannerSrc.includes('127.0.0.1') || activeBannerSrc.includes('placehold.co')}
                />
              </Link>
            ) : (
              <div className="home-hero__banner home-hero__banner--placeholder" />
            )}
          </div>

          <form
            className="home-hero__search"
            onSubmit={(e) => {
              e.preventDefault();
              const q = query.trim();
              setSubmittedQuery(q);
            }}
          >
            <div className="home-hero__search-field">
              <input
                value={query}
                onChange={(e) => {
                  const nextQuery = e.target.value;
                  setQuery(nextQuery);
                  if (!nextQuery.trim()) {
                    setSubmittedQuery('');
                  }
                }}
                placeholder="Search products…"
                className="home-hero__search-input"
                type="text"
                inputMode="search"
              />
              <button className="home-hero__search-button" type="submit" aria-label="Search">
                <svg className="home-hero__search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.5" y1="16.5" x2="21" y2="21" />
                </svg>
              </button>
            </div>
          </form>

          <div className="home-hero__left-card" aria-live="polite">
            {!searchEnabled ? (
                <div className="home-hero__placeholder">
                  <div className="home-hero__placeholder-media" aria-hidden />
                  <div className="home-hero__placeholder-body">
                    <p className="home-hero__placeholder-title">Search to start shopping</p>
                    <p className="home-hero__placeholder-copy">
                      Type a product name above and we’ll show the product card here.
                    </p>
                  </div>
                </div>
              ) : productsLoading ? (
                <div className="home-hero__product-skeleton">
                  <div className="home-hero__product-skeleton-media" />
                  <div className="home-hero__product-skeleton-lines">
                    <div className="home-hero__product-skeleton-line" />
                    <div className="home-hero__product-skeleton-line home-hero__product-skeleton-line--short" />
                    <div className="home-hero__product-skeleton-line home-hero__product-skeleton-line--shorter" />
                  </div>
                </div>
              ) : product ? (
                <div className="home-hero__product-wrap">
                  <ProductCard
                    product={product}
                    variant="minimal"
                    showRatings={false}
                    showQuickActions={false}
                    showQuickView={false}
                    showSwatches={false}
                    showShippingBadges={false}
                    showInterestCount={false}
                  />
                  <div className="home-hero__product-actions">
                    <Link
                      href={`/products?search=${encodeURIComponent(normalizedQuery)}&focusSearch=1`}
                      className="home-hero__view-all"
                    >
                      View all results
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="home-hero__no-results">
                  <p className="home-hero__no-results-title">No results</p>
                  <p className="home-hero__no-results-copy">
                    We couldn’t find anything for “{normalizedQuery}”. Try a different search.
                  </p>
                </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

