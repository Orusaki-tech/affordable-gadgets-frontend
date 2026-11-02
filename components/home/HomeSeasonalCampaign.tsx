'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { ProductCarousel } from '@/components/ProductCarousel';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import { useHomepageCampaign } from '@/lib/hooks/useHomepageCampaign';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
}

/** Seasonal product row above Special Offers. Hidden for shoppers when empty or off. */
export function HomeSeasonalCampaign() {
  const studioEdit = useStudioEditOptional();
  const canEdit = Boolean(studioEdit?.capabilities.canEditFeaturedSelection);
  const reducedMotion = usePrefersReducedMotion();
  const { data, isLoading } = useHomepageCampaign();
  const products = data?.products ?? [];
  const title = data?.title?.trim() || 'Black November';
  const shimmer = data?.animation === 'title_shimmer';

  if (!canEdit && (isLoading || products.length === 0)) {
    return null;
  }

  const section = (
    <section
      id="seasonal-campaign"
      className="home-redesign__featured home-redesign__seasonal ag-section ag-section--tight scroll-mt-28"
    >
      <div className="mb-6">
        <h2
          className={
            shimmer
              ? 'ag-type-h2 home-seasonal__title home-seasonal__title--shimmer'
              : 'ag-type-h2 home-seasonal__title'
          }
        >
          {title}
        </h2>
        {canEdit ? (
          <p className="mt-1 text-xs font-semibold text-primary">
            Seasonal campaign · {studioEdit?.capabilities.editableSummary}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <p className="ag-type-body text-secondary">Loading campaign…</p>
      ) : products.length > 0 ? (
        <ProductCarousel
          itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
          showNavigation
          showPagination={false}
          autoPlay={!reducedMotion && products.length > 1}
          autoPlayInterval={6000}
          pauseOffscreen
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="featured"
              studioAllowDelete={false}
            />
          ))}
        </ProductCarousel>
      ) : (
        <p className="ag-type-body text-secondary">
          This row is hidden on the shop until you add products and turn the campaign on.
        </p>
      )}
    </section>
  );

  if (!canEdit) return section;

  return (
    <StudioBlockChrome
      label="Seasonal campaign"
      roleHint={studioEdit?.capabilities.roleLabel}
      onEdit={() => studioEdit?.openEditSeasonalCampaign()}
    >
      {section}
    </StudioBlockChrome>
  );
}
