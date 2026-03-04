'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PaginatedPublicPromotionList, PublicPromotion } from '@/lib/api/generated';
import { usePromotions } from '@/lib/hooks/usePromotions';
import { useProducts } from '@/lib/hooks/useProducts';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { ProductCard } from '@/components/ProductCard';
import { getCloudinarySizedImageUrl } from '@/lib/utils/cloudinary';
import { getProductHref } from '@/lib/utils/productRoutes';

const PROMOTIONS_PAGE_SIZE = 50;
const PROMO_THUMB_SIZE = 96;
const HERO_BANNER_SIZE = 1400;

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
  const router = useRouter();
  const { data: promotionsData, isLoading: promosLoading } = usePromotions({
    page_size: PROMOTIONS_PAGE_SIZE,
  });

  const promotions = useMemo(() => {
    const results = (promotionsData as PaginatedPublicPromotionList | undefined)?.results ?? [];
    return sortPromotions(results as PublicPromotion[]);
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
  const debouncedQuery = useDebouncedValue(query, 300);
  const normalizedQuery = debouncedQuery.trim();
  const searchEnabled = normalizedQuery.length >= 2;

  const { data: productsData, isLoading: productsLoading } = useProducts({
    search: searchEnabled ? normalizedQuery : undefined,
    page_size: 1,
    enabled: searchEnabled,
  });
  const product = productsData?.results?.[0] ?? null;

  const activeBannerSrc =
    activePromotion?.banner_image_url || activePromotion?.banner_image || null;

  return (
    <section className="home-hero" aria-label="Homepage hero">
      <div className="home-hero__container">
        <div className="home-hero__promo-row" aria-label="Promotions">
          {promosLoading && promotions.length === 0 ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="home-hero__promo-skeleton" />
              ))}
            </>
          ) : promotions.length > 0 ? (
            promotions.map((promotion) => {
              const id = typeof promotion.id === 'number' ? promotion.id : null;
              const isActive = id !== null && id === activePromotionId;
              const thumbSrc = promotion.banner_image_url || promotion.banner_image || null;
              return (
                <button
                  key={id ?? promotion.title}
                  type="button"
                  className={`home-hero__promo-card ${isActive ? 'home-hero__promo-card--active' : ''}`}
                  onMouseEnter={() => {
                    if (id !== null) setActivePromotionId(id);
                  }}
                  onFocus={() => {
                    if (id !== null) setActivePromotionId(id);
                  }}
                  onClick={() => {
                    if (id !== null) setActivePromotionId(id);
                  }}
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
          ) : (
            <div className="home-hero__promo-empty">No promotions available right now.</div>
          )}
        </div>

        <div className="home-hero__grid">
          <div className="home-hero__left">
            <form
              className="home-hero__search"
              onSubmit={(e) => {
                e.preventDefault();
                const q = query.trim();
                if (!q) return;
                router.push(`/products?search=${encodeURIComponent(q)}&focusSearch=1`);
              }}
            >
              <div className="home-hero__search-field">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products…"
                  className="home-hero__search-input"
                  type="text"
                  inputMode="search"
                />
                <button className="home-hero__search-button" type="submit" aria-label="Search">
                  <svg className="home-hero__search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 0 0114 0z" />
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
        </div>
      </div>
    </section>
  );
}

