import Image from 'next/image';
import Link from 'next/link';
import { brandConfig } from '@/lib/config/brand';
import { getCloudinarySizedImageUrl } from '@/lib/utils/cloudinary';
import { getProductHref } from '@/lib/utils/productRoutes';
import type { PaginatedPublicPromotionList, PublicPromotion } from '@/lib/api/generated';

const PROMOTIONS_PAGE_SIZE = 12;
const HERO_IMAGE_SIZE = 1200;
const GRID_IMAGE_SIZE = 600;

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

function sortPromotions(promotions: PublicPromotion[]) {
  return [...promotions].sort((a, b) => {
    const aPos = a.carousel_position;
    const bPos = b.carousel_position;
    const aHasPos = typeof aPos === 'number';
    const bHasPos = typeof bPos === 'number';

    if (aHasPos && bHasPos) {
      return aPos - bPos;
    }
    if (aHasPos) return -1;
    if (bHasPos) return 1;

    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });
}

async function fetchPromotions(): Promise<PublicPromotion[]> {
  const url = `${brandConfig.apiBaseUrl}/api/v1/public/promotions/?page_size=${PROMOTIONS_PAGE_SIZE}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
      headers: {
        'X-Brand-Code': brandConfig.code,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as PaginatedPublicPromotionList;
    return Array.isArray(data?.results) ? (data.results as PublicPromotion[]) : [];
  } catch {
    return [];
  }
}

function getPromotionHref(promotion: PublicPromotion): string {
  const promotionId = typeof promotion.id === 'number' ? promotion.id : null;
  const firstProductId = Array.isArray(promotion.products) ? promotion.products[0] : null;

  if (firstProductId) {
    return getProductHref(undefined, { fallbackId: firstProductId, promotionId });
  }
  if (promotionId) {
    return `/products?promotion=${promotionId}`;
  }
  return '/products';
}

export async function HeroPromotions() {
  const promotions = await fetchPromotions();
  const filteredPromotions = promotions.filter((promo) => {
    const locations = normalizeLocations(promo.display_locations);
    if (locations.length === 0) return true;
    return (
      locations.includes('special_offers') ||
      locations.includes('flash_sales') ||
      locations.includes('stories_carousel')
    );
  });

  const sortedPromotions = sortPromotions(filteredPromotions);
  const bannerItem =
    sortedPromotions.find((promo) => promo.carousel_position === 1) ?? sortedPromotions[0] ?? null;
  const gridItems = sortedPromotions
    .filter((promo) => promo !== bannerItem)
    .slice(0, 4);

  const bannerImageSrc = bannerItem?.banner_image_url || bannerItem?.banner_image || null;

  return (
    <div className="relative w-full mb-6">
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <div className="lg:col-span-1">
          <div
            className="group relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md"
            style={{
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            }}
          >
            {bannerItem && bannerImageSrc ? (
              <Link href={getPromotionHref(bannerItem)} className="block w-full h-full">
                <Image
                  src={getCloudinarySizedImageUrl(bannerImageSrc, HERO_IMAGE_SIZE, 'cover')}
                  alt={bannerItem.title}
                  width={HERO_IMAGE_SIZE}
                  height={HERO_IMAGE_SIZE}
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover w-full h-full transition-transform duration-300"
                />
              </Link>
            ) : (
              <div className="w-full h-full bg-lime-100/60" />
            )}
          </div>
        </div>

        <div className="lg:col-span-1 grid grid-cols-2 gap-4">
          {gridItems.length > 0
            ? gridItems.map((promotion) => {
                const imageSrc = promotion.banner_image_url || promotion.banner_image;
                return (
                  <Link
                    key={promotion.id ?? promotion.title}
                    href={getPromotionHref(promotion)}
                    className="group relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md"
                    style={{
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    {imageSrc ? (
                      <Image
                        src={getCloudinarySizedImageUrl(imageSrc, GRID_IMAGE_SIZE, 'contain')}
                        alt={promotion.title}
                        width={GRID_IMAGE_SIZE}
                        height={GRID_IMAGE_SIZE}
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        className="object-contain w-full h-full transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-lime-100/60" />
                    )}
                  </Link>
                );
              })
            : [...Array(4)].map((_, i) => (
                <div
                  key={`promo-grid-placeholder-${i}`}
                  className="w-full aspect-square bg-lime-100/60 rounded-2xl"
                  style={{
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                  }}
                />
              ))}
        </div>
      </div>

      <div className="lg:hidden space-y-4 mb-6">
        {bannerItem && bannerImageSrc ? (
          <Link
            href={getPromotionHref(bannerItem)}
            className="group relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md block"
            style={{
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            }}
          >
            <Image
              src={getCloudinarySizedImageUrl(bannerImageSrc, HERO_IMAGE_SIZE, 'cover')}
              alt={bannerItem.title}
              width={HERO_IMAGE_SIZE}
              height={HERO_IMAGE_SIZE}
              priority
              fetchPriority="high"
              sizes="100vw"
              className="object-cover w-full h-full transition-transform duration-300"
            />
          </Link>
        ) : (
          <div className="w-full aspect-square bg-lime-100/60 rounded-2xl" />
        )}

        <div className="grid grid-cols-2 gap-4">
          {gridItems.length > 0
            ? gridItems.map((promotion) => {
                const imageSrc = promotion.banner_image_url || promotion.banner_image;
                return (
                  <Link
                    key={promotion.id ?? promotion.title}
                    href={getPromotionHref(promotion)}
                    className="group relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md block"
                    style={{
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    {imageSrc ? (
                      <Image
                        src={getCloudinarySizedImageUrl(imageSrc, GRID_IMAGE_SIZE, 'contain')}
                        alt={promotion.title}
                        width={GRID_IMAGE_SIZE}
                        height={GRID_IMAGE_SIZE}
                        sizes="50vw"
                        className="object-contain w-full h-full transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-lime-100/60" />
                    )}
                  </Link>
                );
              })
            : [...Array(4)].map((_, i) => (
                <div
                  key={`promo-grid-mobile-placeholder-${i}`}
                  className="w-full aspect-square bg-lime-100/60 rounded-2xl"
                />
              ))}
        </div>
      </div>
    </div>
  );
}
