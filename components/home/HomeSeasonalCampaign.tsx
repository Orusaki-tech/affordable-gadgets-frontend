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

function cardPrice(product: SeasonalCampaignProduct) {
  const promo = typeof product.promo_price === 'number' ? product.promo_price : null;
  const catalog = typeof product.min_price === 'number' ? product.min_price : null;
  return {
    price: promo ?? catalog,
    compare: promo != null && catalog != null && catalog > promo ? catalog : null,
  };
}

function SeasonalCard({ product }: { product: SeasonalCampaignProduct }) {
  const image =
    product.promo_image_url || product.primary_image || getPlaceholderProductImage(product.product_name);
  const { price, compare } = cardPrice(product);

  return (
    <Link href={getProductHref(product)} className="home-seasonal__card">
      <div className="home-seasonal__media">
        <CloudinaryImage
          src={image}
          alt={product.product_name}
          preset="productThumb"
          sizes="(max-width: 640px) 50vw, 25vw"
          className="home-seasonal__image"
          fill
        />
      </div>
      <div className="home-seasonal__body">
        <p className="home-seasonal__name">{product.product_name}</p>
        <p className="home-seasonal__price">
          {price != null ? <span>{formatPrice(price)}</span> : <span>Price on request</span>}
          {compare != null ? (
            <span className="home-seasonal__compare">{formatPrice(compare)}</span>
          ) : null}
        </p>
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
      className="home-redesign__seasonal ag-section ag-section--tight scroll-mt-28"
    >
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
        <p className="ag-type-body text-secondary">Loading campaign…</p>
      ) : products.length > 0 ? (
        <div className="home-seasonal__grid">
          {products.map((product) => (
            <SeasonalCard key={product.id} product={product} />
          ))}
        </div>
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
