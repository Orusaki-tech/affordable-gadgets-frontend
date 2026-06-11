'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { CATEGORY_CARDS, type CategoryCard } from '@/lib/config/categories';
import { useInfiniteProducts, useProducts } from '@/lib/hooks/useProducts';
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
              <CloudinaryImage
                src={category.image}
                alt={category.name}
                preset="card"
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

function CategoryProductsSkeleton({ title, sectionId }: { title: string; sectionId: string }) {
  return (
    <div id={sectionId} className="categories-page__section categories-page__section--skeleton" aria-hidden="true">
      <div className="categories-page__section-header">
        <h2 className="categories-page__section-title section-label">{title}</h2>
        <span className="categories-page__section-link categories-page__section-link--placeholder">View All →</span>
      </div>
      <div className="categories-page__products">
        {[...Array(4)].map((_, i) => (
          <div key={`cat-skel-${sectionId}-${i}`} className="categories-page__product-skeleton" />
        ))}
      </div>
    </div>
  );
}

function CategoryProducts({ category }: { category: CategoryCard }) {
  const isAccessories = category.code === 'AC';
  const ACCESSORIES_PAGE_SIZE = 24;
  const [accessoriesVisibleCount, setAccessoriesVisibleCount] = useState(12);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const isLoadingMoreRef = useRef(false);

  const infiniteAccessories = useInfiniteProducts(
    isAccessories
      ? { type: category.code, page_size: ACCESSORIES_PAGE_SIZE }
      : { enabled: false }
  );
  const pagedProducts = useProducts({ type: category.code, page_size: 4, enabled: !isAccessories });

  const allAccessories = isAccessories
    ? (infiniteAccessories.data?.pages ?? []).flatMap((p) => p.results ?? [])
    : [];

  const data = isAccessories ? undefined : pagedProducts.data;
  const isLoading = isAccessories ? infiniteAccessories.isLoading : pagedProducts.isLoading;
  const isFetching = isAccessories ? infiniteAccessories.isFetching : pagedProducts.isFetching;

  const filteredResults = (isAccessories ? allAccessories : (data?.results ?? [])).filter(
    (product) => product.product_type === category.code
  );
  const visibleProducts = isAccessories
    ? filteredResults.slice(0, accessoriesVisibleCount)
    : filteredResults;
  const hasNextAccessoriesPage = isAccessories && !!infiniteAccessories.hasNextPage;
  const hasMoreAccessories =
    isAccessories && (accessoriesVisibleCount < filteredResults.length || hasNextAccessoriesPage);
  const isFetchingMoreAccessories =
    isAccessories &&
    (infiniteAccessories.isFetchingNextPage || (isFetching && !isLoading));

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
        setAccessoriesVisibleCount((currentCount) => currentCount + 12);
        if (infiniteAccessories.hasNextPage) {
          infiniteAccessories.fetchNextPage();
        }
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(triggerElement);
    return () => observer.disconnect();
  }, [isAccessories, hasMoreAccessories, infiniteAccessories]);

  useEffect(() => {
    if (!isFetchingMoreAccessories) {
      isLoadingMoreRef.current = false;
    }
  }, [isFetchingMoreAccessories]);

  if (isLoading) return <CategoryProductsSkeleton title={category.name} sectionId={sectionId} />;

  if ((!isAccessories && !data) || filteredResults.length === 0) {
    // Keep section mounted to avoid layout shift when queries settle (or when a category has no products).
    return (
      <div id={sectionId} className="categories-page__section categories-page__section--empty" aria-live="polite">
        <div className="categories-page__section-header">
          <h2 className="categories-page__section-title section-label">{category.name}</h2>
          {!isAccessories && (
            <Link href={category.href} className="categories-page__section-link" prefetch={false}>
              View All →
            </Link>
          )}
        </div>
        <p className="categories-page__empty-text">No products available in this category yet.</p>
      </div>
    );
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







