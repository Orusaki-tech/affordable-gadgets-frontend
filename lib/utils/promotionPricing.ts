import type { PublicPromotion } from '@/lib/api/generated';

type PromotionPricingProduct = {
  id?: number;
};

export function getFeaturedOverridePrice(
  promotion?: PublicPromotion | null,
  product?: PromotionPricingProduct | null,
): number | null {
  if (!promotion || !product || typeof product.id !== 'number') {
    return null;
  }

  const featuredProductId = promotion.featured_product;
  const rawPrice = promotion.featured_sale_price;
  if (typeof featuredProductId !== 'number' || product.id !== featuredProductId) {
    return null;
  }
  if (rawPrice === null || rawPrice === undefined || rawPrice === '') {
    return null;
  }

  const price = Number(rawPrice);
  return Number.isFinite(price) ? price : null;
}

export function getPromotionPriceForUnit(
  promotion: PublicPromotion | null | undefined,
  product: PromotionPricingProduct | null | undefined,
  originalPrice: number,
): number | null {
  if (!promotion || !product || !Number.isFinite(originalPrice)) {
    return null;
  }

  const featuredOverride = getFeaturedOverridePrice(promotion, product);
  if (featuredOverride !== null) {
    return featuredOverride;
  }

  if (promotion.discount_percentage) {
    const discount = (originalPrice * Number(promotion.discount_percentage)) / 100;
    const promoPrice = originalPrice - discount;
    return promoPrice < originalPrice ? promoPrice : null;
  }

  if (promotion.discount_amount) {
    const promoPrice = Math.max(0, originalPrice - Number(promotion.discount_amount));
    return promoPrice < originalPrice ? promoPrice : null;
  }

  return null;
}

export type PromotionDisplayPrice = {
  currentPrice: number;
  originalPrice: number | null;
  hasPromotion: boolean;
};

export function resolvePromotionDisplayPrice(
  promotion: PublicPromotion | null | undefined,
  product: PromotionPricingProduct | null | undefined,
  originalPrice: number | null | undefined,
  options?: { applyPromotion?: boolean },
): PromotionDisplayPrice | null {
  if (originalPrice === null || originalPrice === undefined || !Number.isFinite(originalPrice)) {
    return null;
  }

  const applyPromotion = options?.applyPromotion !== false;
  if (!applyPromotion) {
    return { currentPrice: originalPrice, originalPrice: null, hasPromotion: false };
  }

  const promoPrice = getPromotionPriceForUnit(promotion, product, originalPrice);
  if (promoPrice !== null && promoPrice < originalPrice) {
    return { currentPrice: promoPrice, originalPrice, hasPromotion: true };
  }

  return { currentPrice: originalPrice, originalPrice: null, hasPromotion: false };
}
