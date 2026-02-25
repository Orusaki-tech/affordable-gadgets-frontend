'use client';

import { useProducts, useFeaturedProducts } from '@/lib/hooks/useProducts';
import { getApiErrorInfo } from '@/lib/utils/apiError';
import { ProductCard } from './ProductCard';
import { ProductCarousel } from './ProductCarousel';
import { useState } from 'react';

type ProductCardOptions = {
  variant?: 'default' | 'minimal' | 'featured';
  showInterestCount?: boolean;
  showQuickActions?: boolean;
  showQuickView?: boolean;
  showRatings?: boolean;
  showSwatches?: boolean;
  showShippingBadges?: boolean;
};

interface ProductGridProps {
  pageSize?: number;
  showPagination?: boolean;
  cardOptions?: ProductCardOptions;
  /** When true, fetches only 5 products tagged "Featured" for fast homepage load. */
  featuredOnly?: boolean;
}

export function ProductGrid({ pageSize = 12, showPagination = true, cardOptions, featuredOnly = false }: ProductGridProps = {}) {
  const [page, setPage] = useState(1);
  const productsQuery = useProducts({ page, page_size: pageSize, enabled: !featuredOnly });
  const featuredQuery = useFeaturedProducts();
  const { data, isLoading, error } = featuredOnly ? featuredQuery : productsQuery;

  if (isLoading) {
    const skeletonCount = featuredOnly ? 5 : 8;
    return (
      <div className="product-grid product-grid__list product-grid__list--loading">
        {[...Array(skeletonCount)].map((_, i) => (
          <div key={i} className="product-grid__skeleton" />
        ))}
      </div>
    );
  }

  if (error) {
    const { message, status, url } = getApiErrorInfo(error);
    console.error('Product loading error:', { message, status, url });
    return (
      <div className="product-grid product-grid__error">
        <p className="product-grid__error-title">Error loading products. Please try again later.</p>
        <p className="product-grid__error-details">
          {error instanceof Error ? error.message : 'Unable to connect to the server'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="product-grid__error-action"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    const placeholderCount = featuredOnly ? 5 : 8;
    return (
      <div className="product-grid product-grid__list product-grid__list--placeholder">
        {[...Array(placeholderCount)].map((_, i) => (
          <div key={i} className="product-grid__placeholder-card">
            <div className="product-grid__placeholder-media">
              <span className="product-grid__placeholder-icon">📱</span>
            </div>
            <div className="product-grid__placeholder-body">
              <div className="product-grid__placeholder-line product-grid__placeholder-line--primary"></div>
              <div className="product-grid__placeholder-line product-grid__placeholder-line--secondary"></div>
              <div className="product-grid__placeholder-line product-grid__placeholder-line--tertiary"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="product-grid">
      <ProductCarousel
        itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
        showNavigation={true}
        showPagination={showPagination}
        autoPlay={false}
      >
        {data.results.map((product) => (
          <ProductCard key={product.id} product={product} {...cardOptions} />
        ))}
      </ProductCarousel>

      {/* Pagination */}
      {showPagination && (data.next || data.previous) && (() => {
        const totalPages = Math.max(1, Math.ceil(data.count / pageSize));
        const displayPage = Math.min(page, totalPages);
        return (
        <div className="product-grid__pagination">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!data.previous}
            className="product-grid__pagination-button"
          >
            Previous
          </button>
          <span className="product-grid__pagination-status">
            Page {displayPage} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.next}
            className="product-grid__pagination-button"
          >
            Next
          </button>
        </div>
        );
      })()}
    </div>
  );
}

