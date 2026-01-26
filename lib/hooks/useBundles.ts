/**
 * React Query hooks for bundles
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiService, PaginatedPublicBundleList } from '@/lib/api/generated';

export interface PublicBundleItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_type: string;
  quantity: number;
  override_price: number | null;
  display_order: number;
  primary_image: string | null;
  min_price: number | null;
  max_price: number | null;
}

export function useBundles(params?: { productId?: number }) {
  return useQuery<PaginatedPublicBundleList>({
    queryKey: ['bundles', params?.productId],
    queryFn: () => ApiService.apiV1PublicBundlesList(1, params?.productId),
    staleTime: 30000, // Reduced from 60s to 30s for faster updates
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    enabled: params?.productId !== undefined && params.productId > 0, // Only fetch if productId is valid
  });
}
