/**
 * React Query hooks for products
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ApiService,
  PublicProduct,
  PublicInventoryUnitPublic,
  PaginatedPublicProductList,
} from '@/lib/api/generated';

export function useProducts(params?: {
  page?: number;
  page_size?: number;
  type?: string;
  search?: string;
  brand_filter?: string;
  min_price?: number;
  max_price?: number;
  ordering?: string;
  promotion?: number; // Promotion ID to filter products
  enabled?: boolean;
}) {
  return useQuery<PaginatedPublicProductList>({
    queryKey: ['products', params],
    queryFn: () => {
      const {
        page,
        page_size,
        type,
        search,
        brand_filter,
        min_price,
        max_price,
        ordering,
        promotion,
      } = params || {};
      return ApiService.apiV1PublicProductsList(
        brand_filter,
        max_price,
        min_price,
        ordering,
        page,
        page_size,
        promotion,
        search,
        undefined,
        type
      );
    },
    enabled: params?.enabled ?? true,
    staleTime: 30000, // 30 seconds
  });
}

export function useProduct(id: number) {
  return useQuery<PublicProduct>({
    queryKey: ['product', id],
    queryFn: () => ApiService.apiV1PublicProductsRetrieve(id),
    enabled: !!id,
    staleTime: 30000, // Keep cached products fresh for short navigations
  });
}

export function useProductBySlug(slug: string) {
  return useQuery<PublicProduct>({
    queryKey: ['product', 'slug', slug],
    queryFn: () =>
      ApiService.apiV1PublicProductsList(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        slug,
        undefined
      ).then((response) => {
        if (response.results.length > 0) {
          return response.results[0];
        }
        throw new Error(`Product "${slug}" not found.`);
      }),
    enabled: !!slug,
    retry: 1, // Only retry once
    retryOnMount: false, // Don't retry on mount if it failed
  });
}

export function useProductUnits(
  productId: number,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery<PublicInventoryUnitPublic[]>({
    queryKey: ['product', productId, 'units'],
    queryFn: async () => {
      const response = await ApiService.apiV1PublicProductsUnitsList(productId);
      if (Array.isArray(response)) {
        return response;
      }
      return response?.results ?? [];
    },
    enabled: (options?.enabled ?? true) && productId > 0,
    staleTime: 10000, // 10 seconds (more frequent updates for stock)
  });
}

