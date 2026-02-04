'use client';

import { usePromotions } from '@/lib/hooks/usePromotions';
import { PublicPromotion } from '@/lib/api/generated';
import Link from 'next/link';
import Image from 'next/image';
import { getProductHref } from '@/lib/utils/productRoutes';
import { ProductCarousel } from './ProductCarousel';

interface SpecialOffersProps {
  filter?: 'special_offers' | 'flash_sales';
  pageSize?: number;
}

export function SpecialOffers({ filter, pageSize }: SpecialOffersProps = {}) {
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-lime-100/60 animate-pulse rounded-2xl aspect-square" />
        ))}
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    return (
      <div>
        <h2 className="text-3xl font-bold mb-6">Special Offers</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-lime-100/60 aspect-square" />
          ))}
        </div>
      </div>
    );
  }

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

  // Filter promotions based on filter prop or default behavior
  const filteredPromotions = (data?.results || []).filter((promo: PublicPromotion) => {
    const locations = normalizeLocations(promo.display_locations);
    const hasLocations = locations.length > 0;

    // If no display_locations configured, show by default (backward compat).
    if (!hasLocations) {
      return true;
    }

    if (filter === 'special_offers') {
      return isLocationMatch(locations, 'special_offers');
    }
    if (filter === 'flash_sales') {
      return isLocationMatch(locations, 'flash_sales');
    }

    // Default: show all allowed promo locations.
    return (
      locations.includes('special_offers') ||
      locations.includes('flash_sales') ||
      locations.includes('stories_carousel')
    );
  });

  const specialOffersPromotions =
    filter || filteredPromotions.length > 0 ? filteredPromotions : data?.results || [];

  const sectionTitle = filter === 'flash_sales' 
    ? 'Flash Sales' 
    : filter === 'special_offers' 
    ? 'Special Offers' 
    : 'Special Offers';

  return (
    <div>
      <h2 className="section-label mb-6">{sectionTitle}</h2>
      {specialOffersPromotions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No special offers available at the moment.</p>
          <Link href="/products" className="text-[var(--primary)] hover:underline">
            View All Products
          </Link>
        </div>
      ) : (
        <ProductCarousel
          itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
          showNavigation={true}
          showPagination={false}
          autoPlay={false}
        >
          {specialOffersPromotions.map((promotion: PublicPromotion, index) => {
            // Get first product ID from promotion
            const firstProductId = promotion.products && promotion.products.length > 0 
              ? promotion.products[0] 
              : null;
            const promotionImageSrc = promotion.banner_image_url || promotion.banner_image;
            const promotionId = typeof promotion.id === 'number' ? promotion.id : null;
            const href = firstProductId
              ? getProductHref(undefined, { fallbackId: firstProductId, promotionId })
              : promotionId
                ? `/products?promotion=${promotionId}`
                : '/products';

            return (
              <Link
                key={promotion.id ?? `${promotion.title}-${index}`}
                href={href}
                className="relative block rounded-2xl bg-lime-100/80 p-6 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer aspect-square"
              >
                <div className="relative w-full h-full">
                  {promotionImageSrc && (
                    <Image
                      src={promotionImageSrc}
                      alt={promotion.title}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      priority={index === 0}
                      loading={index < 2 ? 'eager' : 'lazy'}
                      className="object-contain transition-transform duration-300 hover:scale-[1.02]"
                      unoptimized={promotionImageSrc.includes('placehold.co')}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </ProductCarousel>
      )}
    </div>
  );
}

