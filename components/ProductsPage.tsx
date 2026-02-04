'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProducts } from '@/lib/hooks/useProducts';
import { usePromotion } from '@/lib/hooks/usePromotions';
import { PublicPromotion } from '@/lib/api/generated';
import { ProductCard } from './ProductCard';
import { ProductFilters, FilterState } from './ProductFilters';
import { getProductHref } from '@/lib/utils/productRoutes';
import Link from 'next/link';

type ProductCardOptions = {
  variant?: 'default' | 'minimal' | 'featured';
  showInterestCount?: boolean;
  showQuickActions?: boolean;
  showQuickView?: boolean;
  showRatings?: boolean;
  showSwatches?: boolean;
  showShippingBadges?: boolean;
};

interface ProductsPageProps {
  cardOptions?: ProductCardOptions;
}

export function ProductsPage({ cardOptions }: ProductsPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const promotionId = searchParams.get('promotion');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
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
  const [autoOpenFilters, setAutoOpenFilters] = useState(false);

  // Fetch promotion details if promotion ID is in URL
  const { data: promotionData } = usePromotion(promotionId ? parseInt(promotionId) : 0);

  const singlePromotionProductId = useMemo(() => {
    if (!promotionData || !Array.isArray(promotionData.products)) return null;
    return promotionData.products.length === 1 ? promotionData.products[0] : null;
  }, [promotionData]);

  useEffect(() => {
    if (!promotionId || singlePromotionProductId === null) return;
    const promotionIdValue = parseInt(promotionId);
    if (Number.isNaN(promotionIdValue)) return;
    router.replace(
      getProductHref(undefined, {
        fallbackId: singlePromotionProductId,
        promotionId: promotionIdValue,
      })
    );
  }, [promotionId, router, singlePromotionProductId]);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAutoOpenFilters(
        window.location.hash === '#product-filters' ||
          Boolean(initialFilters.minPrice || initialFilters.maxPrice)
      );
    }
  }, [initialFilters]);

  const updateQueryParams = (nextFilters?: FilterState, nextSearch?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const updateParam = (key: string, value?: string) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    };

    const filtersToApply = nextFilters ?? filters;
    updateParam('type', filtersToApply.type);
    updateParam('brand', filtersToApply.brand);
    updateParam('min_price', filtersToApply.minPrice);
    updateParam('max_price', filtersToApply.maxPrice);
    updateParam('search', nextSearch ?? search);

    const paramString = params.toString();
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const nextUrl = `/products${paramString ? `?${paramString}` : ''}${hash}`;
    router.replace(nextUrl, { scroll: false });
  };

  // Use backend filter for promotion - this ensures proper pagination and filtering
  const { data, isLoading, error } = useProducts({
    page,
    page_size: 24,
    type: filters.type || undefined,
    search: search || undefined,
    brand_filter: filters.brand || undefined,
    min_price: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
    max_price: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
    ordering: sort || undefined,
    promotion: promotionId ? parseInt(promotionId) : undefined, // Backend will filter by promotion
  });
  const filteredResults = useMemo(() => {
    if (!data?.results) return [];
    if (!filters.type) return data.results;
    return data.results.filter((product) => product.product_type === filters.type);
  }, [data?.results, filters.type]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateQueryParams(undefined, search);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
    updateQueryParams(newFilters);
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(1);
  };

  return (
    <div>
      {promotionData ? (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <h1 className="section-label">{promotionData.title}</h1>
              {promotionData.description && (
                <p className="text-gray-600 sm:max-w-[520px] sm:truncate">
                  {promotionData.description}
                </p>
              )}
            </div>
            <form
              onSubmit={handleSearch}
              className="flex w-full gap-3 md:w-auto md:min-w-[320px] md:max-w-[520px]"
            >
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)]"
              >
                Search
              </button>
            </form>
          </div>
          {/* Note: promotion_code is not in the Promotion interface, but keeping for backward compatibility */}
          {(promotionData as PublicPromotion & { promotion_code?: string }).promotion_code && (
            <p className="text-sm text-gray-500 mt-2">
              Promotion Code:{' '}
              <code className="bg-white px-2 py-1 rounded">
                {(promotionData as PublicPromotion & { promotion_code?: string }).promotion_code}
              </code>
            </p>
          )}
        </div>
      ) : (
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="section-label">Products</h1>
          <form
            onSubmit={handleSearch}
            className="flex w-full gap-3 md:w-auto md:min-w-[280px] md:max-w-[440px] lg:max-w-[480px]"
          >
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)]"
            >
              Search
            </button>
          </form>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-8">
        {/* Filters Sidebar */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductFilters
            onFiltersChange={handleFiltersChange}
            onSortChange={handleSortChange}
            initialFilters={filters}
            autoOpen={autoOpenFilters}
          />
        </div>

        {/* Results */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-96" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Error loading products. Please try again later.</p>
            </div>
          ) : !data || filteredResults.length === 0 ? (
            <div className="text-center py-12">
              {promotionId && promotionData ? (
                <p className="text-gray-600 mb-4">No products available for this promotion.</p>
              ) : (
                <p className="text-gray-600">No products found.</p>
              )}
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                Showing {filteredResults.length} of {data.count} product{data.count !== 1 ? 's' : ''}
                {promotionId && promotionData && (
                  <span className="ml-2 text-sm text-[var(--primary)]">
                    (filtered by promotion: {promotionData.title})
                  </span>
                )}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResults.map((product) => (
                  <ProductCard key={product.id} product={product} {...cardOptions} />
                ))}
              </div>

              {/* Pagination */}
              {(data.next || data.previous) && (
                <div className="flex justify-center gap-4 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!data.previous}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {page} of {Math.ceil(data.count / 24)}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!data.next}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

