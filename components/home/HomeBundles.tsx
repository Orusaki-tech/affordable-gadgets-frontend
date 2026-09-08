'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '@/lib/api/generated';
import type { PublicBundle } from '@/lib/api/generated';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { MaterialIcon } from '@/components/MaterialIcon';
import { getProductHref } from '@/lib/utils/productRoutes';

function formatKes(value?: number | string | null) {
  if (value == null || value === '') return null;
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return null;
  return `KSh ${Math.round(num).toLocaleString('en-KE')}`;
}

function BundleCard({ bundle }: { bundle: PublicBundle }) {
  const items = bundle.items ?? [];
  const href = bundle.main_product_slug
    ? getProductHref({ slug: bundle.main_product_slug, id: bundle.main_product_id })
    : '/products';
  const price =
    formatKes(bundle.bundle_price) ||
    formatKes(bundle.items_min_total) ||
    formatKes(bundle.items_max_total);
  const thumb = items.find((item) => item.primary_image)?.primary_image;

  return (
    <Link
      href={href}
      className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-sm transition hover:shadow-md"
    >
      <div>
        {bundle.discount_amount || bundle.discount_percentage ? (
          <span className="mb-2 inline-flex rounded bg-badge-bundle-orange/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-badge-bundle-orange">
            Package deal
          </span>
        ) : (
          <span className="mb-2 inline-flex rounded bg-surface-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            {items.length || 0} units included
          </span>
        )}
        <h3 className="text-lg font-bold text-primary">{bundle.title}</h3>
        {bundle.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-secondary">{bundle.description}</p>
        ) : null}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex -space-x-2">
          {items.slice(0, 3).map((item) => (
            <div
              key={item.id ?? `${item.product_id}-${item.display_order}`}
              className="relative h-12 w-12 overflow-hidden rounded-lg border-2 border-white bg-surface-muted"
            >
              {item.primary_image ? (
                <CloudinaryImage
                  src={item.primary_image}
                  alt={item.product_name || 'Bundle item'}
                  fill
                  className="object-contain p-1"
                  sizes="48px"
                />
              ) : null}
            </div>
          ))}
          {!items.length && thumb ? (
            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-surface-muted">
              <CloudinaryImage src={thumb} alt="" fill className="object-contain p-1" sizes="48px" />
            </div>
          ) : null}
        </div>
        <div className="text-right">
          {price ? <p className="text-sm font-bold text-primary">{price}</p> : null}
          <p className="text-xs font-semibold text-stock-green">View bundle</p>
        </div>
      </div>
    </Link>
  );
}

export function HomeBundles() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['bundles', 'homepage'],
    queryFn: () => ApiService.apiV1PublicBundlesList(1),
    staleTime: 60_000,
  });

  const bundles = (data?.results ?? []).filter(
    (b) => b.is_currently_active !== false
  ) as PublicBundle[];

  if (!isLoading && (isError || bundles.length === 0)) {
    return null;
  }

  return (
    <section className="mx-auto mt-14 max-w-[1400px] px-4 lg:px-6">
      <div className="home-section-panel">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-badge-bundle-orange">
              Hardware Packages
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              Curated Ecosystem Bundles
            </h2>
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-stock-green">
              <MaterialIcon name="verified" className="text-[16px]" />
              Includes free Nairobi delivery on eligible packages
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-48 animate-pulse rounded-2xl bg-surface-container" />
            <div className="h-48 animate-pulse rounded-2xl bg-surface-container" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {bundles.slice(0, 4).map((bundle) => (
              <BundleCard key={bundle.id ?? bundle.title} bundle={bundle} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
