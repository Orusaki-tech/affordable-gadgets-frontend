'use client';

import { PublicPromotion } from '@/lib/api/generated';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { StudioPromoTile } from '@/components/studio/StudioPromoTile';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import { getPromotionHref } from '@/lib/utils/promotionRoutes';
import { ProductCarousel } from './ProductCarousel';

interface SpecialOffersCarouselProps {
  promotions: PublicPromotion[];
  sectionTitle?: string;
  showSectionTitle?: boolean;
}

function normalizeLocations(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function SpecialOffersCarousel({
  promotions,
  sectionTitle = 'Special Offers',
  showSectionTitle = true,
}: SpecialOffersCarouselProps) {
  const studioEdit = useStudioEditOptional();
  const canManage = Boolean(studioEdit?.capabilities.canEditPromotions);

  const body =
    promotions.length === 0 ? (
      <div className="special-offers-carousel">
        {showSectionTitle && (
          <h2 className="special-offers-carousel__title section-label">{sectionTitle}</h2>
        )}
        <div className="special-offers-carousel__grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="special-offers-carousel__card" />
          ))}
        </div>
        {canManage ? (
          <p className="special-offers__empty-text" style={{ marginTop: '0.75rem' }}>
            No offers yet — use Edit to choose promotions for this section.
          </p>
        ) : null}
      </div>
    ) : (
      <div className="special-offers-carousel">
        {showSectionTitle && (
          <h2 className="special-offers-carousel__title section-label">{sectionTitle}</h2>
        )}
        <ProductCarousel
          itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
          showNavigation={true}
          showPagination={false}
          autoPlay
        >
          {promotions.map((promotion, index) => {
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
                className="special-offers-carousel__promo"
                onRemove={
                  canManage && isSpecialOffer && promotion.id
                    ? () => void studioEdit?.removeSpecialOfferPromotion(promotion.id!)
                    : undefined
                }
              >
                <div className="special-offers-carousel__promo-media">
                  {promotionImageSrc && (
                    <CloudinaryImage
                      src={promotionImageSrc}
                      alt={promotion.title}
                      preset="promoTile"
                      className="special-offers-carousel__promo-image"
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

  if (!canManage) return body;

  return (
    <StudioBlockChrome
      label="Special offers"
      roleHint={studioEdit?.capabilities.roleLabel}
      onEdit={() => studioEdit?.openEditSpecialOffers()}
    >
      {body}
    </StudioBlockChrome>
  );
}
