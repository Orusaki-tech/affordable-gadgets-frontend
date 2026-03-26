'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CATEGORY_CARDS, type CategoryCard } from '@/lib/config/categories';
import { useProducts } from '@/lib/hooks/useProducts';
import { ProductCard } from './ProductCard';

export function CategoriesPage() {
  return (
    <div className="categories-page">
      <h1 className="categories-page__title section-label">Shop by Category</h1>

      {/* Category Cards */}
      <div className="categories-page__grid">
        {CATEGORY_CARDS.map((category) => (
          <Link key={category.code} href={category.href} className="categories-page__card" prefetch={false}>
            {/* Wrap the image in its own container for the background color */}
            <div className="categories-page__card-image-wrapper">
              <img
                src={category.image}
                alt={category.name}
                className="categories-page__card-icon"
              />
            </div>
            {/* Title sits below the image wrapper */}
            <p className="categories-page__card-title">{category.name}</p>
          </Link>
        ))}
      </div>

      {/* Featured Products by Category */}
      <div className="categories-page__sections">
        {CATEGORY_CARDS.map((category) => (
          <CategoryProducts key={category.code} category={category} />
        ))}
      </div>
    </div>
  );
}

function CategoryProducts({ category }: { category: CategoryCard }) {
  const isAccessories = category.code === 'AC';
  const INITIAL_ACCESSORIES_COUNT = 12;
  const ACCESSORIES_LOAD_MORE_COUNT = 12;
  const [accessoriesVisibleCount, setAccessoriesVisibleCount] = useState(INITIAL_ACCESSORIES_COUNT);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const isLoadingMoreRef = useRef(false);
  const requestedPageSize = isAccessories ? accessoriesVisibleCount : 4;

  const { data, isLoading, isFetching } = useProducts({ type: category.code, page_size: requestedPageSize });
  const filteredResults = (data?.results ?? []).filter(
    (product) => product.product_type === category.code
  );
  const visibleProducts = isAccessories
    ? filteredResults.slice(0, accessoriesVisibleCount)
    : filteredResults;
  const totalCount = data?.count ?? filteredResults.length;
  const hasMoreAccessories = isAccessories && accessoriesVisibleCount < totalCount;
  const isFetchingMoreAccessories = isAccessories && isFetching && !isLoading;

  const sectionId = category.name.toLowerCase().replace(/\s*\/\s*/g, '-');

  useEffect(() => {
    if (!isAccessories) return;
    if (!hasMoreAccessories) return;
    const triggerElement = loadMoreTriggerRef.current;
    if (!triggerElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (!firstEntry?.isIntersecting) return;
        if (isLoadingMoreRef.current) return;
        isLoadingMoreRef.current = true;
        setAccessoriesVisibleCount((currentCount) => currentCount + ACCESSORIES_LOAD_MORE_COUNT);
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(triggerElement);
    return () => observer.disconnect();
  }, [isAccessories, hasMoreAccessories]);

  useEffect(() => {
    if (!isFetchingMoreAccessories) {
      isLoadingMoreRef.current = false;
    }
  }, [isFetchingMoreAccessories]);

  if (isLoading) {
    return (
      <div id={sectionId} className="categories-page__section">
        <h2 className="categories-page__section-heading">{category.name}</h2>
        <div className="categories-page__products">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="categories-page__skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || filteredResults.length === 0) {
    return null;
  }

  return (
    <div id={sectionId} className="categories-page__section">
      <div className="categories-page__section-header">
        <h2 className="categories-page__section-title section-label">{category.name}</h2>
        {!isAccessories && (
          <Link
            href={category.href}
            className="categories-page__section-link"
            prefetch={false}
          >
            View All →
          </Link>
        )}
      </div>
      <div className="categories-page__products">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {isAccessories && (
        <div className="categories-page__infinite-scroll">
          {hasMoreAccessories ? (
            <>
              <div ref={loadMoreTriggerRef} className="categories-page__load-trigger" aria-hidden />
              {isFetchingMoreAccessories && (
                <p className="categories-page__loading-text">Loading more accessories...</p>
              )}
            </>
          ) : (
            <p className="categories-page__loading-text">All accessories loaded</p>
          )}
        </div>
      )}
    </div>
  );
}







