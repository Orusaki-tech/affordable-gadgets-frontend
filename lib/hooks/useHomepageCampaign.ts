'use client';

import { useQuery } from '@tanstack/react-query';
import { OpenAPI, type PublicProduct } from '@/lib/api/generated';
import { apiBaseUrl } from '@/lib/api/openapi';

export type HomepageCampaignAnimation = 'none' | 'title_shimmer';

export type SeasonalCampaignProduct = PublicProduct & {
  promo_image_url?: string | null;
  promo_price?: number | null;
};

export type PublicHomepageCampaign = {
  title: string;
  animation: HomepageCampaignAnimation;
  products: SeasonalCampaignProduct[];
};

export async function fetchHomepageCampaign(): Promise<PublicHomepageCampaign> {
  OpenAPI.BASE = apiBaseUrl;
  const base = OpenAPI.BASE.replace(/\/+$/, '');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': '1',
    ...(typeof OpenAPI.HEADERS === 'function'
      ? await OpenAPI.HEADERS({} as never)
      : (OpenAPI.HEADERS ?? {})),
  };
  const res = await fetch(`${base}/api/v1/public/homepage-campaign/`, {
    credentials: 'omit',
    cache: 'no-store',
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Homepage campaign request failed: ${res.status}`);
  }
  return res.json();
}

/** Same ratio the API uses so a higher storage keeps the Black November discount. */
export function seasonalUnitPrice(
  listPrice: number,
  promoPrice: number,
  anchorPrice: number,
): number | null {
  if (!Number.isFinite(listPrice) || !Number.isFinite(promoPrice) || !Number.isFinite(anchorPrice)) {
    return null;
  }
  if (anchorPrice <= 0 || promoPrice < 0 || promoPrice >= anchorPrice) return null;
  const scaled = Math.round((listPrice * promoPrice * 100) / anchorPrice) / 100;
  return scaled < listPrice ? scaled : null;
}

export function useHomepageCampaign() {
  return useQuery<PublicHomepageCampaign>({
    queryKey: ['homepage-campaign'],
    queryFn: fetchHomepageCampaign,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
