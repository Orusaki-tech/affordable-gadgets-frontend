/**
 * React Query hooks for promotions
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiService, OpenAPI, PublicPromotion, PaginatedPublicPromotionList } from '@/lib/api/generated';
import { apiBaseUrl } from '@/lib/api/openapi';

export function usePromotions(params?: {
  page?: number;
  page_size?: number;
}) {
  return useQuery<PaginatedPublicPromotionList>({
    queryKey: ['promotions', params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (typeof params?.page === 'number') {
        query.set('page', String(params.page));
      }
      if (typeof params?.page_size === 'number') {
        query.set('page_size', String(params.page_size));
      }
      const headers = typeof OpenAPI.HEADERS === 'function'
        ? await OpenAPI.HEADERS({} as never)
        : (OpenAPI.HEADERS ?? {});
      const response = await fetch(`${apiBaseUrl}/api/v1/public/promotions/?${query.toString()}`, {
        headers,
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Failed to load promotions: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 60000, // 1 minute
  });
}

export function usePromotion(id: number) {
  return useQuery<PublicPromotion>({
    queryKey: ['promotion', id],
    queryFn: () => ApiService.apiV1PublicPromotionsRetrieve(id),
    enabled: !!id,
  });
}







