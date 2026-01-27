'use client';

import { PublicPromotion } from '@/lib/api/generated';
import Link from 'next/link';
import Image from 'next/image';
import { getProductHref } from '@/lib/utils/productRoutes';
import { ProductCarousel } from './ProductCarousel';

interface SpecialOffersCarouselProps {
  promotions: PublicPromotion[];
  sectionTitle?: string;
}

export function SpecialOffersCarousel({ promotions, sectionTitle = 'Special Offers' }: SpecialOffersCarouselProps) {
  if (promotions.length === 0) {
    return (
      <div>
        <h2 className="text-3xl font-bold mb-6">{sectionTitle}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-lime-100/60 aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">{sectionTitle}</h2>
      <ProductCarousel
        itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
        showNavigation={true}
        showPagination={false}
        autoPlay={false}
      >
        {promotions.map((promotion, index) => {
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
    </div>
  );
}
