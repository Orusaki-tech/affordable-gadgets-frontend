'use client';

import { useEffect, useState } from 'react';
import { useProducts } from '@/lib/hooks/useProducts';
import { ProductCard } from './ProductCard';
import { ProductCarousel } from './ProductCarousel';

export function RecentlyViewed() {
  const [productIds, setProductIds] = useState<number[]>([]);
  const { data } = useProducts({
    page_size: 10,
  });

  useEffect(() => {
    const recentlyViewed = JSON.parse(
      localStorage.getItem('recentlyViewed') || '[]'
    ) as number[];
    setProductIds(recentlyViewed);
  }, []);

  const recentlyViewedProducts = (data?.results || []).filter(
    (p): p is typeof p & { id: number } =>
      typeof p.id === 'number' && productIds.includes(p.id)
  );

  // Sort by recently viewed order
  const sortedProducts = recentlyViewedProducts.sort((a, b) => {
    const indexA = productIds.indexOf(a.id);
    const indexB = productIds.indexOf(b.id);
    return indexA - indexB;
  });

  if (productIds.length === 0 || sortedProducts.length === 0) {
    // Show placeholder recently viewed
    return (
      <div className="recently-viewed">
        <ProductCarousel
          itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
          showNavigation={true}
          showPagination={false}
          autoPlay={false}
        >
          {[...Array(4)].map((_, i) => (
            <div key={i} className="recently-viewed__placeholder">
              <div className="recently-viewed__placeholder-media">
                <span className="recently-viewed__placeholder-icon">👁️</span>
              </div>
              <div className="recently-viewed__placeholder-body">
                <div className="recently-viewed__placeholder-line recently-viewed__placeholder-line--title"></div>
                <div className="recently-viewed__placeholder-line recently-viewed__placeholder-line--subtitle"></div>
                <div className="recently-viewed__placeholder-line recently-viewed__placeholder-line--price"></div>
              </div>
            </div>
          ))}
        </ProductCarousel>
      </div>
    );
  }

  return (
    <div className="recently-viewed">
      <ProductCarousel
        itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
        showNavigation={true}
        showPagination={false}
        autoPlay={false}
      >
        {sortedProducts.map((product) => (
          <ProductCard key={product.id} product={product} variant="featured" />
        ))}
      </ProductCarousel>
    </div>
  );
}

