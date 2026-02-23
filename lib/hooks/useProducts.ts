/**
 * React Query hooks for products
 */
'use client';

import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import {
  ApiService,
  PublicProduct,
  PublicInventoryUnitPublic,
  PaginatedPublicProductList,
} from '@/lib/api/generated';

/** Number of items to fetch for the first request (visible above the fold). Next page is prefetched after this loads. */
export const PRODUCTS_VISIBLE_PAGE_SIZE = 12;

/** Find a product in cached list pages (by id or slug) for instant detail placeholder. */
function getProductFromListCache(
  queryClient: QueryClient,
  opts: { id?: number; slug?: string }
): PublicProduct | undefined {
  const entries = queryClient.getQueriesData<PaginatedPublicProductList>({ queryKey: ['products'] });
  for (const [, data] of entries) {
    if (!data?.results?.length) continue;
    const match = data.results.find(
      (p) =>
        (opts.id != null && p.id === opts.id) ||
        (opts.slug != null && (p as PublicProduct & { slug?: string }).slug === opts.slug)
    );
    if (match) return match as PublicProduct;
  }
  return undefined;
}

export type ProductsQueryParams = {
  page?: number;
  page_size?: number;
  type?: string;
  search?: string;
  brand_filter?: string;
  min_price?: number;
  max_price?: number;
  ordering?: string;
  promotion?: number;
  enabled?: boolean;
};

/** Used by useProducts and by prefetch so next-page prefetch uses the same API call. */
export function productsQueryFn({
  queryKey,
}: {
  queryKey: readonly unknown[];
}): Promise<PaginatedPublicProductList> {
  const params = (queryKey[1] ?? {}) as ProductsQueryParams;
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
  } = params;
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
}

export function useProducts(params?: ProductsQueryParams) {
  return useQuery<PaginatedPublicProductList>({
    queryKey: ['products', params],
    queryFn: productsQueryFn,
    enabled: params?.enabled ?? true,
    staleTime: 30000, // 30 seconds
    placeholderData: keepPreviousData, // Keep showing list when refetching (e.g. back from detail)
  });
}

export function useProduct(id: number, options?: { placeholderFromList?: PublicProduct }) {
  const queryClient = useQueryClient();
  return useQuery<PublicProduct>({
    queryKey: ['product', id],
    queryFn: () => ApiService.apiV1PublicProductsRetrieve(id),
    enabled: !!id,
    staleTime: 30000, // Keep cached products fresh for short navigations
    placeholderData: () =>
      options?.placeholderFromList ?? getProductFromListCache(queryClient, { id }),
  });
}

export function useProductBySlug(slug: string, options?: { placeholderFromList?: PublicProduct }) {
  const queryClient = useQueryClient();
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
    placeholderData: () =>
      options?.placeholderFromList ?? getProductFromListCache(queryClient, { slug }),
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
      let units: PublicInventoryUnitPublic[] = [];
      if (Array.isArray(response)) {
        units = response;
      } else {
        units = response?.results ?? [];
      }
      // Debug: Log units with storage_gb to help diagnose issues
      if (process.env.NODE_ENV === 'development') {
        console.log(`[useProductUnits] Product ${productId} units:`, units.map(u => ({
          id: u.id,
          storage_gb: u.storage_gb,
          selling_price: u.selling_price
        })));
      }
      return units;
    },
    enabled: (options?.enabled ?? true) && productId > 0,
    staleTime: 10000, // 10 seconds (more frequent updates for stock)
  });
}

/** Prefetch product detail and units (e.g. on card hover) so the detail page is ready on click. */
export function prefetchProductDetail(queryClient: QueryClient, product: PublicProduct): void {
  const id = product.id;
  const slug = (product as PublicProduct & { slug?: string }).slug;
  if (id != null) {
    queryClient.prefetchQuery({
      queryKey: ['product', id],
      queryFn: () => ApiService.apiV1PublicProductsRetrieve(id),
      staleTime: 30000,
    });
    queryClient.prefetchQuery({
      queryKey: ['product', id, 'units'],
      queryFn: async () => {
        const response = await ApiService.apiV1PublicProductsUnitsList(id);
        return Array.isArray(response) ? response : response?.results ?? [];
      },
      staleTime: 10000,
    });
  }
  if (slug?.trim()) {
    queryClient.prefetchQuery({
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
        ).then((res) => (res.results.length > 0 ? res.results[0] : Promise.reject(new Error(`Product "${slug}" not found.`)))),
      staleTime: 30000,
    });
  }
}

