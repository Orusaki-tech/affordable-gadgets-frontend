import { brandConfig } from '@/lib/config/brand';
import type { PaginatedPublicPromotionList, PublicPromotion } from '@/lib/api/generated';
import { SpecialOffersCarousel } from './SpecialOffersCarousel';

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

  return <SpecialOffersCarousel promotions={specialOffersPromotions} sectionTitle={sectionTitle} />;
}
