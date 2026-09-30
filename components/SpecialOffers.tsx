'use client';

import { usePromotions } from '@/lib/hooks/usePromotions';
import { PublicPromotion } from '@/lib/api/generated';
import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { getPromotionHref } from '@/lib/utils/promotionRoutes';
import { ProductCarousel } from './ProductCarousel';
import { StudioPromoTile } from '@/components/studio/StudioPromoTile';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';

interface SpecialOffersProps {
  filter?: 'special_offers' | 'flash_sales';
  pageSize?: number;
}

export function SpecialOffers({ filter, pageSize }: SpecialOffersProps = {}) {
  const studioEdit = useStudioEditOptional();
  const canManage = Boolean(studioEdit?.capabilities.canEditPromotions);
  const resolvedPageSize = typeof pageSize === 'number'
    ? pageSize
    : filter
      ? 100
      : 12;
  const displayLocations = filter
    ? [filter]
    : ['special_offers', 'flash_sales', 'stories_carousel'];
  const { data, isLoading } = usePromotions({
    page_size: resolvedPageSize,
    display_location: displayLocations,
  });

  const normalizeLocations = (value: unknown): string[] => {
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
  };

  const isLocationMatch = (locations: string[], location: 'special_offers' | 'flash_sales') =>
    locations.includes(location);

  const filteredPromotions = (data?.results || []).filter((promo: PublicPromotion) => {
    const locations = normalizeLocations(promo.display_locations);
    const hasLocations = locations.length > 0;

    if (!hasLocations) {
      return true;
    }

    if (filter === 'special_offers') {
      return isLocationMatch(locations, 'special_offers');
    }
    if (filter === 'flash_sales') {
      return isLocationMatch(locations, 'flash_sales');
    }

    return (
      locations.includes('special_offers') ||
      locations.includes('flash_sales') ||
      locations.includes('stories_carousel')
    );
  });

  const specialOffersPromotions =
    filter || filteredPromotions.length > 0 ? filteredPromotions : data?.results || [];

  const sectionTitle =
    filter === 'flash_sales'
      ? 'Flash Sales'
      : filter === 'special_offers'
        ? 'Special Offers'
        : 'Special Offers';

  const openManager = () => studioEdit?.openEditSpecialOffers();

  const body = (() => {
    if (isLoading) {
      return (
        <div className="special-offers special-offers__grid special-offers__grid--loading">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="special-offers__card special-offers__card--loading" />
          ))}
        </div>
      );
    }

    if (!data || data.results.length === 0 || specialOffersPromotions.length === 0) {
      return (
        <div className="special-offers">
          <h2 className="special-offers__title section-label">{sectionTitle}</h2>
          <div className="special-offers__empty">
            <p className="special-offers__empty-text">No special offers available at the moment.</p>
            {canManage ? (
              <button
                type="button"
                className="special-offers__empty-link"
                onClick={openManager}
              >
                Choose special offers
              </button>
            ) : (
              <Link href="/products" className="special-offers__empty-link">
                View All Products
              </Link>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="special-offers">
        <h2 className="special-offers__title section-label">{sectionTitle}</h2>
        <ProductCarousel
          itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
          showNavigation={true}
          showPagination={false}
          autoPlay
        >
          {specialOffersPromotions.map((promotion: PublicPromotion, index) => {
            const promotionImageSrc = promotion.banner_image_url || promotion.banner_image;
            const href = getPromotionHref(promotion);
            const isSpecialOffer = normalizeLocations(promotion.display_locations).includes(
              'special_offers'
            );

            return (
              <StudioPromoTile
                key={promotion.id ?? `${promotion.title}-${index}`}
                promotionId={promotion.id}
                title={promotion.title}
                href={href}
                className="special-offers__promo"
                onRemove={
                  canManage && isSpecialOffer && promotion.id
                    ? () => void studioEdit?.removeSpecialOfferPromotion(promotion.id!)
                    : undefined
                }
              >
                <div className="special-offers__promo-media">
                  {promotionImageSrc && (
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
                  )}
                </div>
              </StudioPromoTile>
            );
          })}
        </ProductCarousel>
      </div>
    );
  })();

  if (!canManage) return body;

  return (
    <StudioBlockChrome
      label="Special offers"
      roleHint={studioEdit?.capabilities.roleLabel}
      onEdit={openManager}
    >
      {body}
    </StudioBlockChrome>
  );
}
