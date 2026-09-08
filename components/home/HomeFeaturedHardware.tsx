'use client';

import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useFeaturedProducts } from '@/lib/hooks/useProducts';
import { getProductHref } from '@/lib/utils/productRoutes';
import type { PublicProductList } from '@/lib/api/generated';

function formatKes(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return `KSh ${Math.round(value).toLocaleString('en-KE')}`;
}

function ProductTile({ product }: { product: PublicProductList }) {
  const href = getProductHref(product);
  const price = formatKes(product.min_price);
  const compare = formatKes(product.compare_at_min_price);
  const name = product.product_name || 'Product';

  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <div className="relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-surface-muted p-3">
        {product.primary_image ? (
          <CloudinaryImage
            src={product.primary_image}
            alt={name}
            fill
            className="object-contain transition group-hover:scale-[1.03]"
            sizes="(max-width:768px) 50vw, 20vw"
          />
        ) : (
          <MaterialIcon name="smartphone" className="text-[40px] text-text-muted" />
        )}
      </div>
      <span className="mb-2 inline-flex items-center gap-1 rounded bg-surface-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        <MaterialIcon name="verified" className="text-[12px] text-stock-green" />
        Featured
      </span>
      <h3 className="line-clamp-2 text-sm font-semibold text-primary">{name}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        {price ? <span className="text-base font-bold text-on-surface">{price}</span> : null}
        {compare ? <span className="text-xs text-text-muted line-through">{compare}</span> : null}
      </div>
      <span className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-promo-lime transition group-hover:bg-obsidian-dark">
        <MaterialIcon name="visibility" className="text-[16px]" />
        View
      </span>
    </Link>
  );
}

export function HomeFeaturedHardware() {
  const { data, isLoading, isError } = useFeaturedProducts();
  const products = (data?.results ?? []).slice(0, 5);
  const total = data?.count ?? products.length;

  if (!isLoading && (isError || products.length === 0)) {
    return null;
  }

  return (
    <section id="featured-products" className="mx-auto mt-12 max-w-[1400px] scroll-mt-28 px-4 lg:px-6">
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
              Showing {products.length} of {total} certified flagships
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

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-surface-container" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {products.map((product) => (
            <ProductTile key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
