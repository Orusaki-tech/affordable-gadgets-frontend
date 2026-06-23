'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { PaginatedPublicPromotionList, PublicPromotion } from '@/lib/api/generated';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { usePromotions } from '@/lib/hooks/usePromotions';
import { useProducts } from '@/lib/hooks/useProducts';
import { ProductCard } from '@/components/ProductCard';
import { brandConfig } from '@/lib/config/brand';
import { getProductHref } from '@/lib/utils/productRoutes';

type PromotionPromoCard = {
  product_id: number;
  product_name: string;
  product_slug?: string | null;
  product_image_url?: string | null;
  option_summary?: string | null;
  original_price: string;
  promotional_price: string;
};

type HomeHeroPromotion = PublicPromotion & {
  promo_card?: PromotionPromoCard | null;
};

const PROMOTIONS_PAGE_SIZE = 50;
const HERO_AUTOPLAY_INTERVAL_MS = 6000;
const HERO_PROMOTION_PLACEHOLDER_IMAGE =
  'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773069898/pixel8_cd7p2f.png';

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

function sortPromotions(promotions: HomeHeroPromotion[]) {
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

function getPromotionHref(promotion: HomeHeroPromotion): string {
  const promotionId = typeof promotion.id === 'number' ? promotion.id : null;
  const promoCardProductId = promotion.promo_card?.product_id ?? null;
  const firstProductId = promoCardProductId ?? (Array.isArray(promotion.products) ? promotion.products[0] : null);

  if (firstProductId) {
    return getProductHref(undefined, { fallbackId: firstProductId, promotionId });
  }
  if (promotionId) {
    return `/products?promotion=${promotionId}`;
  }
  return '/products';
}

function getHeroPromotions(promotionsData?: PaginatedPublicPromotionList): HomeHeroPromotion[] {
  const results = promotionsData?.results ?? [];

  const featuredForHero = (results as HomeHeroPromotion[]).filter((promo) => {
    const locations = normalizeLocations(promo.display_locations);
    return locations.length > 0 && locations.includes('homepage_hero');
  });

  return sortPromotions(featuredForHero);
}

function resolveMediaUrl(image?: string | null): string | null {
  if (!image?.trim()) return null;
  if (image.startsWith('http')) return image;
  return `${brandConfig.apiBaseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
}

function getHeroBannerSrc(promotion: HomeHeroPromotion | null): string | null {
  if (!promotion) return null;
  return resolveMediaUrl(promotion.banner_image_url) || resolveMediaUrl(promotion.banner_image) || null;
}

type HomeHeroProps = {
  initialPromotionsData?: PaginatedPublicPromotionList;
};

export function HomeHero({ initialPromotionsData }: HomeHeroProps) {
  const { data: promotionsData } = usePromotions({
    page_size: PROMOTIONS_PAGE_SIZE,
    initialData: initialPromotionsData,
  });

  const promotions = useMemo(() => {
    return getHeroPromotions(promotionsData);
  }, [promotionsData]);

  const promoIds = useMemo(() => {
    return promotions
      .map((p) => p.id)
      .filter((id): id is number => typeof id === 'number');
  }, [promotions]);

  const promoIdsKey = useMemo(() => promoIds.join('|'), [promoIds]);

  const [activePromotionId, setActivePromotionId] = useState<number | null>(() => {
    const firstId = getHeroPromotions(initialPromotionsData)[0]?.id;
    return typeof firstId === 'number' ? firstId : null;
  });

  useEffect(() => {
    if (activePromotionId !== null) return;
    const firstId = promoIds[0];
    if (typeof firstId === 'number') setActivePromotionId(firstId);
  }, [activePromotionId, promoIds]);

  // Rotate the hero banner every 6 seconds (no hover required).
  const rotationIndexRef = useRef(0);

  useEffect(() => {
    if (promoIds.length <= 1) return;

    // If banner state is out of sync with available promos, snap to the first.
    if (activePromotionId === null || !promoIds.includes(activePromotionId)) {
      setActivePromotionId(promoIds[0] ?? null);
      rotationIndexRef.current = 0;
    } else {
      rotationIndexRef.current = Math.max(0, promoIds.indexOf(activePromotionId));
    }

    const interval = window.setInterval(() => {
      rotationIndexRef.current = (rotationIndexRef.current + 1) % promoIds.length;
      setActivePromotionId(promoIds[rotationIndexRef.current] ?? null);
    }, HERO_AUTOPLAY_INTERVAL_MS);

    return () => window.clearInterval(interval);
    // Depend on promoIdsKey so we only restart when the promo set/order changes.
  }, [promoIdsKey]);

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

  const activeBannerSrc = useMemo(() => getHeroBannerSrc(activePromotion), [activePromotion]);
  const [bannerImageFailed, setBannerImageFailed] = useState(false);

  useEffect(() => {
    setBannerImageFailed(false);
  }, [activePromotionId, activeBannerSrc]);

  const displayBannerSrc =
    activeBannerSrc && !bannerImageFailed ? activeBannerSrc : HERO_PROMOTION_PLACEHOLDER_IMAGE;
  const showBannerLink = Boolean(activePromotion && activeBannerSrc && !bannerImageFailed);

  const renderHeroBanner = () => {
    const bannerInner = (
      <CloudinaryImage
        src={displayBannerSrc}
        alt={activePromotion?.title ?? 'Promotions'}
        preset="card"
        fit="cover"
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="home-hero__banner-image"
        priority
        fill
        onError={() => setBannerImageFailed(true)}
      />
    );

    if (showBannerLink && activePromotion) {
      return (
        <Link
          href={getPromotionHref(activePromotion)}
          className="home-hero__banner"
          aria-label={activePromotion.title}
        >
          {bannerInner}
        </Link>
      );
    }

    return (
      <div className="home-hero__banner home-hero__banner--placeholder" aria-label="Promotions banner">
        {bannerInner}
      </div>
    );
  };

  return (
    <section className="home-hero" aria-label="Homepage hero">
      <div className="home-hero__container">
        <div className="home-hero__main-grid" aria-label="Promotions">
          <div className="home-hero__content-row">
            <div className="home-hero__left-column">
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

              {!searchEnabled ? (
                <div className="home-hero__left-card" aria-live="polite">
                  <div className="home-hero__placeholder">
                    <div className="home-hero__placeholder-media" aria-hidden>
                      <CloudinaryImage
                        src={HERO_PROMOTION_PLACEHOLDER_IMAGE}
                        alt=""
                        preset="card"
                        sizes="(max-width: 1024px) 100vw, 420px"
                        className="home-hero__placeholder-image"
                        fill
                      />
                    </div>
                    <div className="home-hero__placeholder-body">
                      <p className="home-hero__placeholder-title">Search to start shopping</p>
                      <p className="home-hero__placeholder-copy">
                        Type a product name above and we’ll show the product card here.
                      </p>
                    </div>
                  </div>
                </div>
              ) : productsLoading ? (
                <div className="home-hero__left-card" aria-live="polite">
                  <div className="home-hero__product-skeleton">
                    <div className="home-hero__product-skeleton-media" />
                    <div className="home-hero__product-skeleton-lines">
                      <div className="home-hero__product-skeleton-line" />
                      <div className="home-hero__product-skeleton-line home-hero__product-skeleton-line--short" />
                      <div className="home-hero__product-skeleton-line home-hero__product-skeleton-line--shorter" />
                    </div>
                  </div>
                </div>
              ) : product ? (
                <div className="home-hero__product-result" aria-live="polite">
                  <ProductCard
                    product={product}
                    variant="featured"
                  />
                  <div className="home-hero__product-actions">
                    <Link
                      href={`/products?search=${encodeURIComponent(normalizedQuery)}&openFilters=1`}
                      className="home-hero__view-all"
                    >
                      View all results
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="home-hero__left-card" aria-live="polite">
                  <div className="home-hero__no-results">
                    <p className="home-hero__no-results-title">No results</p>
                    <p className="home-hero__no-results-copy">
                      We couldn’t find anything for “{normalizedQuery}”. Try a different search.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="home-hero__right">{renderHeroBanner()}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

