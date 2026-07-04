import type { PublicPromotion } from '@/lib/api/generated';
import { getProductHref } from '@/lib/utils/productRoutes';

type PromotionLinkSource = {
  id?: number;
  products?: Array<number>;
  promo_card?: PublicPromotion['promo_card'];
  featured_product?: number | null;
};

export function getPromotionHref(promotion: PromotionLinkSource): string {
  const promotionId = typeof promotion.id === 'number' ? promotion.id : null;
  const promoCard = promotion.promo_card;

  if (promoCard?.product_slug) {
    return getProductHref(
      { id: promoCard.product_id, slug: promoCard.product_slug },
      { promotionId },
    );
  }

  const featuredProductId =
    typeof promotion.featured_product === 'number' ? promotion.featured_product : null;
  const promoCardProductId =
    typeof promoCard?.product_id === 'number' ? promoCard.product_id : null;
  const firstProductId =
    promoCardProductId ??
    featuredProductId ??
    (Array.isArray(promotion.products) ? promotion.products[0] : null);

  if (firstProductId) {
    return getProductHref(undefined, { fallbackId: firstProductId, promotionId });
  }
  if (promotionId) {
    return `/products?promotion=${promotionId}`;
  }
  return '/products';
}
