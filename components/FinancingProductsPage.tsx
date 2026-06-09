'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OpenAPI, type PublicProduct } from '@/lib/api/generated';
import { PRODUCTS_VISIBLE_PAGE_SIZE, prefetchProductDetail } from '@/lib/hooks/useProducts';
import { useDebouncedSearchParam } from '@/lib/hooks/useDebouncedSearchParam';
import { ProductCard } from './ProductCard';
import { ProductFilters, type FilterState } from './ProductFilters';

type PaginatedPublicProductList = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: PublicProduct[];
};

async function fetchFinancingProducts(params: {
  page: number;
  page_size: number;
  type?: string;
  search?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  ordering?: string;
}): Promise<PaginatedPublicProductList> {
  const base = OpenAPI.BASE.replace(/\/+$/, '');
  const qs = new URLSearchParams();
  qs.set('financing', '1');
  qs.set('page', String(params.page));
  qs.set('page_size', String(params.page_size));
  if (params.type) qs.set('type', params.type);
  if (params.search) qs.set('search', params.search);
  if (params.brand) qs.set('brand_filter', params.brand);
  if (typeof params.min_price === 'number') qs.set('min_price', String(params.min_price));
  if (typeof params.max_price === 'number') qs.set('max_price', String(params.max_price));
  if (params.ordering) qs.set('ordering', params.ordering);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(typeof OpenAPI.HEADERS === 'function'
      ? await OpenAPI.HEADERS({} as never)
      : (OpenAPI.HEADERS ?? {})),
  };

  const res = await fetch(`${base}/api/v1/public/products/?${qs.toString()}`, {
    credentials: 'omit',
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Financing products request failed: ${res.status}`);
  }
  return res.json();
}

export function FinancingProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(() => {
    const initial = Number(searchParams.get('page') || 1);
    return Number.isFinite(initial) && initial > 0 ? Math.floor(initial) : 1;
  });

  const initialFilters = useMemo<FilterState>(
    () => ({
      type: searchParams.get('type') || '',
      minPrice: searchParams.get('min_price') || '',
      maxPrice: searchParams.get('max_price') || '',
      brand: searchParams.get('brand') || '',
    }),
    [searchParams]
  );
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sort, setSort] = useState('');

  useEffect(() => setFilters(initialFilters), [initialFilters]);
  useEffect(() => {
    const next = Number(searchParams.get('page') || 1);
    const normalized = Number.isFinite(next) && next > 0 ? Math.floor(next) : 1;
    setPage((prev) => (prev === normalized ? prev : normalized));
  }, [searchParams]);

  const updateQueryParams = useCallback(
    (nextFilters?: FilterState, nextSearch?: string, nextPage?: number) => {
      const params = new URLSearchParams(searchParams.toString());
      const updateParam = (key: string, value?: string) => {
        if (value) params.set(key, value);
        else params.delete(key);
      };
      const f = nextFilters ?? filters;
      updateParam('type', f.type);
      updateParam('brand', f.brand);
      updateParam('min_price', f.minPrice);
      updateParam('max_price', f.maxPrice);
      if (nextSearch !== undefined) {
        updateParam('search', nextSearch);
      }
      updateParam(
        'page',
        (typeof nextPage === 'number' ? nextPage : page) > 1
          ? String(typeof nextPage === 'number' ? nextPage : page)
          : undefined
      );
      const qs = params.toString();
      router.replace(`/financing${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [filters, page, router, searchParams]
  );

  const syncSearchToUrl = useCallback(
    (debouncedSearch: string) => {
      updateQueryParams(undefined, debouncedSearch, 1);
    },
    [updateQueryParams]
  );

  const { search, debouncedSearch, handleSearchChange: setSearchValue } = useDebouncedSearchParam({
    onSyncToUrl: syncSearchToUrl,
  });

  const { data, isLoading, error } = useQuery<PaginatedPublicProductList>({
    queryKey: ['products', 'financing', { page, filters, debouncedSearch, sort }],
    queryFn: () =>
      fetchFinancingProducts({
        page,
        page_size: PRODUCTS_VISIBLE_PAGE_SIZE,
        type: filters.type || undefined,
        search: debouncedSearch || undefined,
        brand: filters.brand || undefined,
        min_price: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        max_price: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        ordering: sort || undefined,
      }),
    staleTime: 30000,
  });

  useEffect(() => {
    if (!data?.results?.length) return;
    data.results.slice(0, 4).forEach((p) => prefetchProductDetail(queryClient, p));
  }, [data?.results, queryClient]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
    updateQueryParams(newFilters, undefined, 1);
  };
  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(1);
    updateQueryParams(undefined, undefined, 1);
  };

  return (
    <div className="products-page">
      <div className="products-page__header products-page__header--compact">
        <div>
          <h1 className="products-page__title section-label">Financing</h1>
          <p className="text-sm text-gray-600" style={{ marginTop: 6 }}>
            Shop products with Buy Now Pay Later options. Look for the <strong>Financing available</strong> chip.
          </p>
        </div>
      </div>

      <div className="products-page__layout">
        <div className="products-page__filters">
          <ProductFilters
            onFiltersChange={handleFiltersChange}
            onSortChange={handleSortChange}
            initialFilters={filters}
            search={search}
            onSearchChange={handleSearchChange}
          />
        </div>

        <div className="products-page__results">
          {isLoading ? (
            <div className="products-page__grid products-page__grid--loading">
              {[...Array(PRODUCTS_VISIBLE_PAGE_SIZE)].map((_, i) => (
                <div key={i} className="products-page__skeleton" />
              ))}
            </div>
          ) : error ? (
            <div className="products-page__status products-page__status--error">
              <p>Error loading financing products. Please try again later.</p>
            </div>
          ) : !data || !data.results?.length ? (
            <div className="products-page__status">
              <p className="products-page__status-text">No financing products found.</p>
            </div>
          ) : (
            <>
              <div className="products-page__grid">
                {data.results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {(data.next || data.previous) && (
                <div className="products-page__pagination">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!data.previous}
                    className="products-page__pagination-button"
                  >
                    Previous
                  </button>
                  <span className="products-page__pagination-status">Page {page}</span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!data.next}
                    className="products-page__pagination-button"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
