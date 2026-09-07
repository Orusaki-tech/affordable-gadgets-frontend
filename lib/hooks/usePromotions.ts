/**
 * React Query hooks for promotions
 */
'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { ApiService, PublicPromotion, PaginatedPublicPromotionList } from '@/lib/api/generated';
import { pickActivePromotionForProduct } from '@/lib/utils/promotionPricing';

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
        displayLocationParam,
        queryParams.page,
        queryParams.page_size
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

/** Active promotion attached to a product (URL preference optional). */
export function useActivePromotionForProduct(
  product?: { id?: number; product_type?: string | null } | null,
  preferredPromotionId?: number | null,
) {
  const { data, isLoading, error } = usePromotions({ page_size: 50 });
  const promotion = useMemo(
    () => pickActivePromotionForProduct(data?.results, product, preferredPromotionId),
    [data?.results, product, preferredPromotionId],
  );
  return { promotion, isLoading, error };
}







