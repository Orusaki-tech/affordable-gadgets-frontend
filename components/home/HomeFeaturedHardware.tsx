'use client';

import Link from 'next/link';
import { MaterialIcon } from '@/components/MaterialIcon';
import { ProductGridClient } from '@/components/HomeSectionsClient';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import { useFeaturedProducts } from '@/lib/hooks/useProducts';
import { studioPath } from '@/lib/studio/paths';

/** Featured row uses the original ProductCard, themed for the redesign. */
export function HomeFeaturedHardware() {
  const studioEdit = useStudioEditOptional();
  const canSelect = Boolean(studioEdit?.capabilities.canEditFeaturedSelection);
  const { data, isLoading, isError } = useFeaturedProducts();
  const products = data?.results ?? [];
  const total = data?.count ?? products.length;
  const showing = Math.min(5, products.length);

  if (!isLoading && (isError || products.length === 0) && !canSelect) {
    return null;
  }

  const section = (
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
              Featured Product Highlights
            </h2>
            {!isLoading && products.length > 0 ? (
              <p className="ag-type-body mt-1">
                Showing {showing} of {total} certified flagships
              </p>
            ) : null}
            {canSelect ? (
              <p className="mt-1 text-xs font-semibold text-primary">
                Controlled by the Featured tag · {studioEdit?.capabilities.editableSummary}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {canSelect ? (
              <button
                type="button"
                className="studio-icon-btn studio-icon-btn--edit"
                onClick={() => studioEdit?.openEditFeaturedProducts()}
              >
                <span>Choose products</span>
              </button>
            ) : null}
            <Link
              href={studioPath('/products?featured=1')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              View All
              <MaterialIcon name="chevron_right" className="text-[1.125rem]" />
            </Link>
          </div>
        </div>

        {isLoading || products.length > 0 ? (
          <ProductGridClient
            featuredOnly
            pageSize={5}
            showPagination={false}
            cardOptions={{ variant: 'featured' }}
          />
        ) : (
          <p className="ag-type-body text-secondary">
            No featured products yet. Click Choose products to pick what appears here.
          </p>
        )}
      </div>
    </section>
  );

  if (!canSelect) return section;

  return (
    <StudioBlockChrome
      label="Featured Product Highlights"
      roleHint={studioEdit?.capabilities.roleLabel}
      onEdit={() => studioEdit?.openEditFeaturedProducts()}
    >
      {section}
    </StudioBlockChrome>
  );
}
