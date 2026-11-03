'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import {
  useHomepageCampaign,
  type SeasonalCampaignProduct,
} from '@/lib/hooks/useHomepageCampaign';
import { formatPrice } from '@/lib/utils/format';
import { getPlaceholderProductImage } from '@/lib/utils/placeholders';
import { getProductHref } from '@/lib/utils/productRoutes';

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

function offerFor(product: SeasonalCampaignProduct) {
  const promo = typeof product.promo_price === 'number' ? product.promo_price : null;
  const catalog = typeof product.min_price === 'number' ? product.min_price : null;
  const price = promo ?? catalog;
  const compare = promo != null && catalog != null && catalog > promo ? catalog : null;
  const savedPercent =
    compare != null && price != null && compare > 0
      ? Math.round(((compare - price) / compare) * 100)
      : null;
  return { price, compare, savedPercent };
}

function SeasonalOfferCard({ product }: { product: SeasonalCampaignProduct }) {
  const image =
    product.promo_image_url ||
    product.primary_image ||
    getPlaceholderProductImage(product.product_name);
  const { price, compare, savedPercent } = offerFor(product);

  return (
    <Link href={getProductHref(product)} className="home-seasonal__card">
      <div className="home-seasonal__plate">
        {savedPercent != null && savedPercent > 0 ? (
          <span className="home-seasonal__badge">−{savedPercent}%</span>
        ) : null}
        <CloudinaryImage
          src={image}
          alt={product.product_name}
          preset="productThumb"
          sizes="(max-width: 640px) 50vw, 25vw"
          wrapperClassName="home-seasonal__photo-wrap"
          className="home-seasonal__photo"
          fill
        />
      </div>
      <div className="home-seasonal__meta">
        <p className="home-seasonal__name">{product.product_name}</p>
        <div className="home-seasonal__deal">
          <p className="home-seasonal__prices">
            {price != null ? (
              <span className="home-seasonal__now">{formatPrice(price)}</span>
            ) : (
              <span className="home-seasonal__now">Price on request</span>
            )}
            {compare != null ? (
              <span className="home-seasonal__was">{formatPrice(compare)}</span>
            ) : null}
          </p>
          <span className="home-seasonal__go" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Seasonal product row above Special Offers. Hidden for shoppers when empty or off. */
export function HomeSeasonalCampaign() {
  const studioEdit = useStudioEditOptional();
  const canEdit = Boolean(studioEdit?.capabilities.canEditFeaturedSelection);
  const reducedMotion = usePrefersReducedMotion();
  const { data, isLoading } = useHomepageCampaign();
  const products = data?.products ?? [];
  const title = data?.title?.trim() || 'Black November';
  const shimmer = data?.animation === 'title_shimmer' && !reducedMotion;

  if (!canEdit && (isLoading || products.length === 0)) {
    return null;
  }

  const section = (
    <section
      id="seasonal-campaign"
      className="home-seasonal ag-bleed ag-bleed--dark ag-bleed--spaced scroll-mt-28"
    >
      <div className="ag-bleed__inner">
        <div className="home-seasonal__header">
          <h2
            className={
              shimmer
                ? 'home-seasonal__title home-seasonal__title--shimmer'
                : 'home-seasonal__title'
            }
          >
            {title}
          </h2>
          {canEdit ? (
            <p className="home-seasonal__studio-note">
              Seasonal campaign · {products.length} on the shop
            </p>
          ) : null}
        </div>

        {isLoading ? (
          <p className="text-sm text-white/65">Loading campaign…</p>
        ) : products.length > 0 ? (
          <div className="home-seasonal__grid">
            {products.map((product) => (
              <SeasonalOfferCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/65">
            This row is hidden on the shop until you add products and turn the campaign on.
          </p>
        )}
      </div>
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
