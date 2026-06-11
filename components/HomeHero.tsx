'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { PaginatedPublicPromotionList, PublicPromotion } from '@/lib/api/generated';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { usePromotions } from '@/lib/hooks/usePromotions';
import { useProducts } from '@/lib/hooks/useProducts';
import { ProductCard } from '@/components/ProductCard';
import { ProductCarousel } from '@/components/ProductCarousel';
import { formatPrice } from '@/lib/utils/format';
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
const PROMO_THUMB_SIZE = 320;
// Hero promo cards/banner rotation timing (user request).
const HERO_AUTOPLAY_INTERVAL_MS = 6000;
/** Number of placeholder/skeleton cards when there are no hero promotions (keep 4 visible to match itemsPerView). */
const HERO_PLACEHOLDER_COUNT = 4;
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

  const baseList =
    featuredForHero.length > 0 ? featuredForHero : (results as HomeHeroPromotion[]);

  return sortPromotions(baseList);
}

type HomeHeroProps = {
  initialPromotionsData?: PaginatedPublicPromotionList;
};

export function HomeHero({ initialPromotionsData }: HomeHeroProps) {
  const { data: promotionsData, isLoading: promosLoading } = usePromotions({
    page_size: PROMOTIONS_PAGE_SIZE,
    initialData: initialPromotionsData,
  });

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const promotions = useMemo(() => {
    return getHeroPromotions(promotionsData);
  }, [promotionsData]);

  const showPromoCarousel = promotions.length >= 4;

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

  const selectPromotion = (id: number) => {
    const idx = promoIds.indexOf(id);
    rotationIndexRef.current = idx >= 0 ? idx : 0;
    setActivePromotionId(id);
  };

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

  const renderPromotionCard = (promotion: HomeHeroPromotion): ReactNode => {
    const id = typeof promotion.id === 'number' ? promotion.id : null;
    const isActive = id !== null && id === activePromotionId;
    const promoCard = promotion.promo_card ?? null;
    const thumbSrc = promoCard?.product_image_url || promotion.banner_image_url || promotion.banner_image || null;
    const cardTitle = promoCard?.product_name || promotion.title;
    const optionSummary = promoCard?.option_summary?.trim() || null;
    const originalPrice = promoCard?.original_price ? Number(promoCard.original_price) : null;
    const promotionalPrice = promoCard?.promotional_price ? Number(promoCard.promotional_price) : null;
    const hasPromoPrice =
      originalPrice !== null &&
      Number.isFinite(originalPrice) &&
      promotionalPrice !== null &&
      Number.isFinite(promotionalPrice) &&
      promotionalPrice < originalPrice;

    const className = `home-hero__promo-card ${isActive ? 'home-hero__promo-card--active' : ''}`;
    const key = id ?? promotion.title;

    const inner = (
      <>
        <div className="home-hero__promo-media">
          {thumbSrc ? (
            <CloudinaryImage
              src={thumbSrc}
              alt={cardTitle}
              preset="productThumb"
              width={PROMO_THUMB_SIZE}
              height={PROMO_THUMB_SIZE}
              className="home-hero__promo-image"
            />
          ) : (
            <div className="home-hero__promo-image home-hero__promo-image--placeholder" />
          )}
        </div>
        <div className="home-hero__promo-info">
          <p className="home-hero__promo-title">{cardTitle}</p>
          {optionSummary ? (
            <p className="home-hero__promo-options">{optionSummary}</p>
          ) : promotion.discount_display ? (
            <p className="home-hero__promo-subtitle">{promotion.discount_display}</p>
          ) : promotion.description ? (
            <p className="home-hero__promo-subtitle">{promotion.description}</p>
          ) : (
            <p className="home-hero__promo-subtitle">View offer</p>
          )}
          {hasPromoPrice && (
            <div className="home-hero__promo-price-row">
              <span className="home-hero__promo-price-old">{formatPrice(originalPrice)}</span>
              <span className="home-hero__promo-price-new">{formatPrice(promotionalPrice)}</span>
            </div>
          )}
        </div>
      </>
    );

    // Mobile: promo card behaves as a link to the product details page.
    if (isMobile) {
      return (
        <Link key={key} href={getPromotionHref(promotion)} className={className} aria-label={cardTitle}>
          {inner}
        </Link>
      );
    }

    // Tablet/Desktop: promo card selects the active banner/promo.
    return (
      <button
        key={key}
        type="button"
        className={className}
        onMouseEnter={() => {
          if (id !== null) selectPromotion(id);
        }}
        onFocus={() => {
          if (id !== null) selectPromotion(id);
        }}
        onClick={() => {
          if (id !== null) selectPromotion(id);
        }}
        aria-pressed={isActive}
      >
        {inner}
      </button>
    );
  };

  const carouselContent: ReactNode[] =
    promosLoading && promotions.length === 0
      ? Array.from({ length: HERO_PLACEHOLDER_COUNT }).map((_, i) => (
          <div key={i} className="home-hero__promo-skeleton" />
        ))
      : promotions.length > 0
        ? isMobile
          ? [renderPromotionCard(activePromotion ?? promotions[0]!)]
          : promotions.map((promotion) => renderPromotionCard(promotion))
        : Array.from({ length: HERO_PLACEHOLDER_COUNT }).map((_, index) => (
            <div
              key={index}
              className="home-hero__promo-empty-card"
              aria-label="Promotions coming soon"
            >
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
        {/* Single layout: carousel on top, then two-column hero (left: search + card, right: banner) on desktop */}
        <div className="home-hero__main-grid" aria-label="Promotions">
          {showPromoCarousel && (
            <ProductCarousel
              // Keep the promo cards visible (do not collapse to a single card).
              // Banner rotation is handled by `activePromotionId` + timer.
              itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
              showNavigation={!isMobile}
              alwaysShowNavigation={!isMobile}
              splitNav
              showPagination={false}
              className="home-hero__promo-carousel"
            >
              {...carouselContent}
            </ProductCarousel>
          )}

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

            <div className="home-hero__right">
              {activePromotion && activeBannerSrc ? (
                <Link href={getPromotionHref(activePromotion)} className="home-hero__banner" aria-label={activePromotion.title}>
                  <CloudinaryImage
                    src={activeBannerSrc}
                    alt={activePromotion.title}
                    preset="card"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="home-hero__banner-image"
                    priority
                    fill
                  />
                </Link>
              ) : (
                <div className="home-hero__banner home-hero__banner--placeholder" aria-label="Promotions placeholder">
                  <CloudinaryImage
                    src={HERO_PROMOTION_PLACEHOLDER_IMAGE}
                    alt="Promotions coming soon"
                    preset="card"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="home-hero__banner-image"
                    priority
                    fill
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

