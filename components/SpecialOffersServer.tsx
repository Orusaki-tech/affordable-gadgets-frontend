import Image from 'next/image';
import Link from 'next/link';
import { brandConfig } from '@/lib/config/brand';
import { getProductHref } from '@/lib/utils/productRoutes';
import type { PaginatedPublicPromotionList, PublicPromotion } from '@/lib/api/generated';

interface SpecialOffersServerProps {
  filter?: 'special_offers' | 'flash_sales';
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 12;
const FILTERED_PAGE_SIZE = 100;

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

function buildPromotionsUrl(pageSize: number, displayLocations?: string[]) {
  const searchParams = new URLSearchParams();
  searchParams.set('page_size', String(pageSize));
  if (displayLocations && displayLocations.length > 0) {
    searchParams.set('display_location', displayLocations.join(','));
  }
  return `${brandConfig.apiBaseUrl}/api/v1/public/promotions/?${searchParams.toString()}`;
}

async function fetchPromotions(
  pageSize: number,
  displayLocations?: string[],
): Promise<PublicPromotion[]> {
  const url = buildPromotionsUrl(pageSize, displayLocations);

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

export async function SpecialOffersServer(
  { filter, pageSize }: SpecialOffersServerProps = {}
) {
  const resolvedPageSize = typeof pageSize === 'number'
    ? pageSize
    : filter
      ? FILTERED_PAGE_SIZE
      : DEFAULT_PAGE_SIZE;
  const displayLocations = filter
    ? [filter]
    : ['special_offers', 'flash_sales', 'stories_carousel'];
  const promotions = await fetchPromotions(resolvedPageSize, displayLocations);

  const filteredPromotions = promotions.filter((promo) => {
    const locations = normalizeLocations(promo.display_locations);
    const hasLocations = locations.length > 0;

    if (!hasLocations) {
      return true;
    }

    if (filter === 'special_offers') {
      return locations.includes('special_offers');
    }
    if (filter === 'flash_sales') {
      return locations.includes('flash_sales');
    }

    return (
      locations.includes('special_offers') ||
      locations.includes('flash_sales') ||
      locations.includes('stories_carousel')
    );
  });

  const specialOffersPromotions =
    filter || filteredPromotions.length > 0 ? filteredPromotions : promotions;

  const sectionTitle = filter === 'flash_sales'
    ? 'Flash Sales'
    : 'Special Offers';

  if (specialOffersPromotions.length === 0) {
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {specialOffersPromotions.map((promotion, index) => {
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
      </div>
    </div>
  );
}
