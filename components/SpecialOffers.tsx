'use client';

import { usePromotions } from '@/lib/hooks/usePromotions';
import { useProduct } from '@/lib/hooks/useProducts';
import { PublicPromotion } from '@/lib/api/generated';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getProductHref } from '@/lib/utils/productRoutes';

interface SpecialOffersProps {
  filter?: 'special_offers' | 'flash_sales';
}

export function SpecialOffers({ filter }: SpecialOffersProps = {}) {
  const { data, isLoading } = usePromotions({ page_size: 100 });
  const router = useRouter();

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

  // Filter promotions based on filter prop or default behavior
  const specialOffersPromotions = (data?.results || []).filter((promo: PublicPromotion) => {
    const locations = promo.display_locations || [];
    const hasLocations = Array.isArray(locations) && locations.length > 0;

    // If no display_locations configured, show by default (backward compat).
    if (!hasLocations) {
      return true;
    }

    if (filter === 'special_offers') {
      return locations.includes('special_offers');
    } else if (filter === 'flash_sales') {
      return locations.includes('flash_sales');
    }
    // Default: show both special_offers and flash_sales
    return locations.includes('special_offers') || locations.includes('flash_sales');
  });

  const sectionTitle = filter === 'flash_sales' 
    ? 'Flash Sales' 
    : filter === 'special_offers' 
    ? 'Special Offers' 
    : 'Special Offers';

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">{sectionTitle}</h2>
      {specialOffersPromotions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No special offers available at the moment.</p>
          <Link href="/products" className="text-blue-600 hover:underline">
            View All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {specialOffersPromotions.map((promotion: PublicPromotion) => {
            // Get first product ID from promotion
            const firstProductId = promotion.products && promotion.products.length > 0 
              ? promotion.products[0] 
              : null;
            const promotionImageSrc = promotion.banner_image_url || promotion.banner_image;
            
            // Component to handle product slug fetching and redirect
            const PromotionCard = () => {
              const { data: product } = useProduct(firstProductId || 0);
              
              const handleClick = (e: React.MouseEvent) => {
                e.preventDefault();
                const promotionId = typeof promotion.id === 'number' ? promotion.id : null;
                if (product || firstProductId) {
                  router.push(getProductHref(product ?? undefined, { fallbackId: firstProductId, promotionId }));
                  return;
                }
                if (promotionId) {
                  router.push(`/products?promotion=${promotionId}`);
                  return;
                }
                router.push('/products');
              };
              
              return (
                <div
                  onClick={handleClick}
                  className="relative block rounded-2xl bg-lime-100/80 p-6 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer aspect-square"
                >
                  <div className="relative w-full h-full">
                    {promotionImageSrc && (
                      <Image
                        src={promotionImageSrc}
                        alt={promotion.title}
                        fill
                        className="object-contain transition-transform duration-300 hover:scale-[1.02]"
                        unoptimized={promotionImageSrc.includes('placehold.co')}
                      />
                    )}
                  </div>
                </div>
              );
            };
            
            return <PromotionCard key={promotion.id} />;
          })}
        </div>
      )}
    </div>
  );
}

