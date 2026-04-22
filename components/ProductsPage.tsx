'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useProducts, PRODUCTS_VISIBLE_PAGE_SIZE, productsQueryFn, prefetchProductDetail } from '@/lib/hooks/useProducts';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { usePromotion, prefetchPromotion } from '@/lib/hooks/usePromotions';
import { PublicPromotion } from '@/lib/api/generated';
import { ProductCard } from './ProductCard';
import { ProductFilters, FilterState } from './ProductFilters';
import { getProductHref } from '@/lib/utils/productRoutes';
import { CATEGORY_CARDS } from '@/lib/config/categories';
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
  const searchParamsRef = useRef<string>('');
  const promotionId = searchParams.get('promotion');
  const focusSearch = searchParams.get('focusSearch');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [page, setPage] = useState(() => {
    const initial = Number(searchParams.get('page') || 1);
    return Number.isFinite(initial) && initial > 0 ? Math.floor(initial) : 1;
  });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const initialFilters = useMemo<FilterState>(
    () => ({
      type: searchParams.get('type') || '',
      minPrice: searchParams.get('min_price') || '',
      maxPrice: searchParams.get('max_price') || '',
      brand: searchParams.get('brand_filter') || searchParams.get('brand') || '',
    }),
    [searchParams]
  );
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sort, setSort] = useState('');
  const [autoOpenFilters, setAutoOpenFilters] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    searchParamsRef.current = searchParams.toString();
  }, [searchParams]);

  // Debounce search so we don't refetch on every keystroke (only after user pauses)
  const debouncedSearch = useDebouncedValue(search, 400);

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
    const next = Number(searchParams.get('page') || 1);
    const normalized = Number.isFinite(next) && next > 0 ? Math.floor(next) : 1;
    setPage((prev) => (prev === normalized ? prev : normalized));
  }, [searchParams]);

  useEffect(() => {
    if (!focusSearch) return;
    const raf = window.requestAnimationFrame(() => {
      const el = searchInputRef.current;
      if (!el) return;
      el.focus();
      try {
        el.select();
      } catch {
        // ignore selection issues (e.g. mobile)
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [focusSearch]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAutoOpenFilters(
        window.location.hash === '#product-filters' ||
          Boolean(initialFilters.minPrice || initialFilters.maxPrice)
      );
    }
  }, [initialFilters]);

  const updateQueryParams = (
    nextFilters?: FilterState,
    nextSearch?: string,
    nextPage?: number
  ) => {
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
    updateParam('brand_filter', filtersToApply.brand);
    updateParam('min_price', filtersToApply.minPrice);
    updateParam('max_price', filtersToApply.maxPrice);
    updateParam('search', nextSearch ?? search);
    updateParam(
      'page',
      (typeof nextPage === 'number' ? nextPage : page) > 1
        ? String(typeof nextPage === 'number' ? nextPage : page)
        : undefined
    );

    const paramString = params.toString();
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const nextUrl = `/products${paramString ? `?${paramString}` : ''}${hash}`;
    if (typeof window !== 'undefined') {
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (currentUrl === nextUrl) {
        return;
      }
    }
    router.replace(nextUrl, { scroll: false });
  };

  // First request fetches only visible count; next page is prefetched after this succeeds
  const { data, isLoading, error } = useProducts({
    page,
    page_size: PRODUCTS_VISIBLE_PAGE_SIZE,
    type: filters.type || undefined,
    search: debouncedSearch || undefined,
    brand_filter: filters.brand || undefined,
    min_price: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
    max_price: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
    ordering: sort || undefined,
    promotion: promotionId ? parseInt(promotionId) : undefined, // Backend will filter by promotion
  });

  // Prefetch promotion when in URL so product detail page has it in cache when user clicks through
  useEffect(() => {
    if (!promotionId) return;
    const id = parseInt(promotionId, 10);
    if (!Number.isNaN(id)) prefetchPromotion(queryClient, id);
  }, [promotionId, queryClient]);

  // Prefetch next page and first few product details when current page has loaded
  useEffect(() => {
    if (!data?.results?.length || !data?.count) return;
    const totalPages = Math.ceil(data.count / PRODUCTS_VISIBLE_PAGE_SIZE);
    const nextPage = page + 1;
    if (nextPage <= totalPages) {
      queryClient.prefetchQuery({
        queryKey: [
          'products',
          {
            page: nextPage,
            page_size: PRODUCTS_VISIBLE_PAGE_SIZE,
            type: filters.type || undefined,
            search: debouncedSearch || undefined,
            brand_filter: filters.brand || undefined,
            min_price: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
            max_price: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
            ordering: sort || undefined,
            promotion: promotionId ? parseInt(promotionId) : undefined,
          },
        ],
        queryFn: productsQueryFn,
        staleTime: 30000,
      });
    }
    // Prefetch detail + units for first 4 visible products so first-row clicks are instant
    const firstFew = data.results.slice(0, 4);
    firstFew.forEach((product) => prefetchProductDetail(queryClient, product));
  }, [data?.count, data?.results, page, filters, debouncedSearch, sort, promotionId, queryClient]);

  const filteredResults = useMemo(() => {
    if (!data?.results) return [];
    const normalize = (v?: string) => (v ?? '').trim().toLowerCase();
    const type = normalize(filters.type);
    const brand = normalize(filters.brand);

    return data.results.filter((product) => {
      const matchesType = !type || normalize(product.product_type) === type;
      const matchesBrand = !brand || normalize(product.brand) === brand;
      return matchesType && matchesBrand;
    });
  }, [data?.results, filters.brand, filters.type]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateQueryParams(undefined, search, 1);
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

  useEffect(() => {
    const params = new URLSearchParams(searchParamsRef.current);
    const urlPage = Number(params.get('page') || 1);
    const normalizedUrlPage =
      Number.isFinite(urlPage) && urlPage > 0 ? Math.floor(urlPage) : 1;
    if (normalizedUrlPage === page) return;
    updateQueryParams(undefined, undefined, page);
  }, [page]);

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
                ref={searchInputRef}
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
              ref={searchInputRef}
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

          <div className="products-page__category-tiles" aria-label="Shop by category">
            {CATEGORY_CARDS.map((category) => (
              <Link
                key={category.code}
                href={category.href}
                className="products-page__category-tile"
                prefetch={false}
              >
                <div className="products-page__category-tile-image-wrap">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="products-page__category-tile-image"
                  />
                </div>
                <p className="products-page__category-tile-title">{category.name}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="products-page__results">
          {isLoading ? (
            <div className="products-page__grid products-page__grid--loading">
              {[...Array(PRODUCTS_VISIBLE_PAGE_SIZE)].map((_, i) => (
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
              <div className="products-page__grid">
                {filteredResults.map((product) => (
                  <ProductCard key={product.id} product={product} {...cardOptions} />
                ))}
              </div>

              {/* Pagination */}
              {(data.next || data.previous) && (() => {
                const count = typeof data.count === "number" && Number.isFinite(data.count) ? data.count : null;
                const totalPages = count != null ? Math.max(1, Math.ceil(count / PRODUCTS_VISIBLE_PAGE_SIZE)) : null;
                const displayPage = totalPages != null ? Math.min(page, totalPages) : page;
                return (
                <div className="products-page__pagination">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!data.previous}
                    className="products-page__pagination-button"
                  >
                    Previous
                  </button>
                  <span className="products-page__pagination-status">
                    {totalPages != null ? `Page ${displayPage} of ${totalPages}` : `Page ${displayPage}`}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!data.next}
                    className="products-page__pagination-button"
                  >
                    Next
                  </button>
                </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

