'use client';

import Link from 'next/link';
import { MaterialIcon } from '@/components/MaterialIcon';
import { ProductGridClient } from '@/components/HomeSectionsClient';
import { useFeaturedProducts } from '@/lib/hooks/useProducts';

/** Featured row uses the original ProductCard, themed for the redesign. */
export function HomeFeaturedHardware() {
  const { data, isLoading, isError } = useFeaturedProducts();
  const products = data?.results ?? [];
  const total = data?.count ?? products.length;
  const showing = Math.min(5, products.length);

  if (!isLoading && (isError || products.length === 0)) {
    return null;
  }

  return (
    <section
      id="featured-products"
      className="home-redesign__featured ag-section ag-section--tight scroll-mt-28"
    >
      <div className="home-section-panel">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="ag-type-eyebrow text-stock-green">
              In Stock &amp; Dispatched Today
            </p>
            <h2 className="ag-type-h2 mt-1">
              Featured Hardware Highlights
            </h2>
            {!isLoading ? (
              <p className="ag-type-body mt-1">
                Showing {showing} of {total} certified flagships
              </p>
            ) : null}
          </div>
          <Link
            href="/products?featured=1"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            View All
            <MaterialIcon name="chevron_right" className="text-[1.125rem]" />
          </Link>
        </div>

        <ProductGridClient
          featuredOnly
          pageSize={5}
          showPagination={false}
          cardOptions={{ variant: 'featured' }}
        />
      </div>
    </section>
  );
}
