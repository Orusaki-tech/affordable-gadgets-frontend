'use client';

import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { ProductCarousel } from '@/components/ProductCarousel';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { StudioPromoTile } from '@/components/studio/StudioPromoTile';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import { usePromotions } from '@/lib/hooks/usePromotions';
import type { PublicPromotion } from '@/lib/api/generated';
import { getPromotionHref } from '@/lib/utils/promotionRoutes';

const LOCATION = 'watch_offers' as const;

function normalizeLocations(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

/** Homepage Apple / Samsung / Pixel watch strip — Studio-curated via watch_offers. */
export function HomeWatchFinder() {
  const studioEdit = useStudioEditOptional();
  const canManage = Boolean(studioEdit?.capabilities.canEditPromotions);
  const { data, isLoading } = usePromotions({
    page_size: 24,
    display_location: LOCATION,
  });

  const promotions = (data?.results || []).filter((promo: PublicPromotion) => {
    const locations = normalizeLocations(promo.display_locations);
    if (locations.length === 0) return true;
    return locations.includes(LOCATION);
  });

  const openManager = () => studioEdit?.openEditWatchOffers();

  if (!isLoading && promotions.length === 0 && !canManage) {
    return null;
  }

  const body = (() => {
    if (isLoading) {
      return (
        <div className="special-offers">
          <h2 id="home-watch-offers-title" className="special-offers__title section-label">
            Apple, Samsung &amp; Pixel Watches
          </h2>
          <div className="special-offers__grid special-offers__grid--loading">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="special-offers__card special-offers__card--loading" />
            ))}
          </div>
        </div>
      );
    }

    if (promotions.length === 0) {
      return (
        <div className="special-offers">
          <h2 id="home-watch-offers-title" className="special-offers__title section-label">
            Apple, Samsung &amp; Pixel Watches
          </h2>
          <div className="special-offers__empty">
            <p className="special-offers__empty-text">
              No watch offers selected yet. Choose Apple, Samsung, or Pixel watch creatives.
            </p>
            {canManage ? (
              <button type="button" className="special-offers__empty-link" onClick={openManager}>
                Choose watch offers
              </button>
            ) : (
              <Link href="/products?type=AC&search=watch" className="special-offers__empty-link">
                Browse watches
              </Link>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="special-offers">
        <h2 id="home-watch-offers-title" className="special-offers__title section-label">
          Apple, Samsung &amp; Pixel Watches
        </h2>
        <ProductCarousel
          itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
          showNavigation
          showPagination={false}
          autoPlay
        >
          {promotions.map((promotion: PublicPromotion, index) => {
            const promotionImageSrc = promotion.banner_image_url || promotion.banner_image;
            const href = getPromotionHref(promotion);
            const isWatchOffer = normalizeLocations(promotion.display_locations).includes(LOCATION);

            return (
              <StudioPromoTile
                key={promotion.id ?? `${promotion.title}-${index}`}
                promotionId={promotion.id}
                title={promotion.title}
                href={href}
                className="special-offers__promo"
                onRemove={
                  canManage && isWatchOffer && promotion.id
                    ? () => void studioEdit?.removeWatchOfferPromotion(promotion.id!)
                    : undefined
                }
              >
                <div className="special-offers__promo-media">
                  {promotionImageSrc ? (
                    <CloudinaryImage
                      src={promotionImageSrc}
                      alt={promotion.title}
                      preset="promoTile"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      priority={false}
                      loading={index < 2 ? 'eager' : 'lazy'}
                      className="special-offers__promo-image"
                      fill
                    />
                  ) : null}
                </div>
              </StudioPromoTile>
            );
          })}
        </ProductCarousel>
        <div className="mt-5">
          <Link
            href="/products?type=AC&search=watch"
            className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            Browse all watches
          </Link>
        </div>
      </div>
    );
  })();

  const section = (
    <section
      id="smart-watches"
      className="ag-section ag-section--tight scroll-mt-28"
      aria-labelledby="home-watch-offers-title"
    >
      <div className="home-section-panel">{body}</div>
    </section>
  );

  if (!canManage) return section;

  return (
    <StudioBlockChrome
      label="Watch offers"
      roleHint={studioEdit?.capabilities.roleLabel}
      onEdit={openManager}
    >
      {section}
    </StudioBlockChrome>
  );
}
