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
    <div className="products-page">
      {promotionData ? (
        <div className="products-page__promo">
          <div className="products-page__promo-header">
            <div className="products-page__promo-meta">
              <h1 className="products-page__title section-label">{promotionData.title}</h1>
              {promotionData.description && (
                <p className="products-page__promo-description">
                  {promotionData.description}
                </p>
              )}
            </div>
            <form
              onSubmit={handleSearch}
              className="products-page__search"
            >
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="products-page__search-input"
              />
              <button
                type="submit"
                className="products-page__search-button"
              >
                Search
              </button>
            </form>
          </div>
          {/* Note: promotion_code is not in the Promotion interface, but keeping for backward compatibility */}
          {(promotionData as PublicPromotion & { promotion_code?: string }).promotion_code && (
            <p className="products-page__promo-code">
              Promotion Code:{' '}
              <code className="products-page__promo-code-value">
                {(promotionData as PublicPromotion & { promotion_code?: string }).promotion_code}
              </code>
            </p>
          )}
        </div>
      ) : (
        <div className="products-page__header">
          <h1 className="products-page__title section-label">Products</h1>
          <form
            onSubmit={handleSearch}
            className="products-page__search"
          >
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="products-page__search-input"
            />
            <button
              type="submit"
              className="products-page__search-button"
            >
              Search
            </button>
          </form>
        </div>
      )}

      <div className="products-page__layout">
        {/* Filters Sidebar */}
        <div className="products-page__filters">
          <ProductFilters
            onFiltersChange={handleFiltersChange}
            onSortChange={handleSortChange}
            initialFilters={filters}
            autoOpen={autoOpenFilters}
          />
        </div>

        {/* Results */}
        <div className="products-page__results">
          {isLoading ? (
            <div className="products-page__grid products-page__grid--loading">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="products-page__skeleton" />
              ))}
            </div>
          ) : error ? (
            <div className="products-page__status products-page__status--error">
              <p>Error loading products. Please try again later.</p>
            </div>
          ) : !data || filteredResults.length === 0 ? (
            <div className="products-page__status">
              {promotionId && promotionData ? (
                <p className="products-page__status-text">No products available for this promotion.</p>
              ) : (
                <p className="products-page__status-text">No products found.</p>
              )}
            </div>
          ) : (
            <>
              <p className="products-page__summary">
                Showing {filteredResults.length} of {data.count} product{data.count !== 1 ? 's' : ''}
                {promotionId && promotionData && (
                  <span className="products-page__summary-note">
                    (filtered by promotion: {promotionData.title})
                  </span>
                )}
              </p>
              <div className="products-page__grid">
                {filteredResults.map((product) => (
                  <ProductCard key={product.id} product={product} {...cardOptions} />
                ))}
              </div>

              {/* Pagination */}
              {(data.next || data.previous) && (
                <div className="products-page__pagination">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!data.previous}
                    className="products-page__pagination-button"
                  >
                    Previous
                  </button>
                  <span className="products-page__pagination-status">
                    Page {page} of {Math.ceil(data.count / 24)}
                  </span>
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

