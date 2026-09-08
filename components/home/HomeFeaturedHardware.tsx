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
      className="home-redesign__featured mx-auto mt-12 max-w-[1400px] scroll-mt-28 px-4 lg:px-6"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stock-green">
            In Stock &amp; Dispatched Today
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Featured Hardware Highlights
          </h2>
          {!isLoading ? (
            <p className="mt-1 text-sm text-secondary">
              Showing {showing} of {total} certified flagships
            </p>
          ) : null}
        </div>
        <Link
          href="/products?featured=1"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          View All
          <MaterialIcon name="chevron_right" className="text-[18px]" />
        </Link>
      </div>

      <ProductGridClient
        featuredOnly
        pageSize={5}
        showPagination={false}
        cardOptions={{ variant: 'featured' }}
      />
    </section>
  );
}
