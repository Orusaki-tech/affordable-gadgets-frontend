/**
 * React Query hooks for promotions
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { ApiService, PublicPromotion, PaginatedPublicPromotionList } from '@/lib/api/generated';

/** Prefetch a single promotion (e.g. when promotionId is in URL so detail page has it in cache). */
export function prefetchPromotion(queryClient: QueryClient, id: number): void {
  if (!id) return;
  queryClient.prefetchQuery({
    queryKey: ['promotion', id],
    queryFn: () => ApiService.apiV1PublicPromotionsRetrieve(id),
  });
}

export function usePromotions(params?: {
  page?: number;
  page_size?: number;
  display_location?: string | string[];
  initialData?: PaginatedPublicPromotionList;
}) {
  const { initialData, ...queryParams } = params ?? {};
  const displayLocationParam = Array.isArray(queryParams.display_location)
    ? queryParams.display_location.join(',')
    : queryParams.display_location;
  return useQuery<PaginatedPublicPromotionList>({
    queryKey: ['promotions', queryParams],
    queryFn: () =>
      ApiService.apiV1PublicPromotionsList(
        queryParams.page,
        queryParams.page_size,
        displayLocationParam
      ),
    initialData,
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







