'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import { usePromotions } from '@/lib/hooks/usePromotions';
import type { ProductsBrandBannerConfig } from '@/lib/config/products-brand-banners';
import { studioPath } from '@/lib/studio/paths';

type ProductsBrandBannerProps = {
  config: ProductsBrandBannerConfig;
};

function normalizeLocations(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function ProductsBrandBanner({ config }: ProductsBrandBannerProps) {
  const studioEdit = useStudioEditOptional();
  const canEdit = Boolean(studioEdit?.capabilities.canEditPromotions);
  const { data } = usePromotions({
    display_location: 'brand_banner',
    page_size: 50,
  });

  const cmsPromo = useMemo(() => {
    const needle = config.brandFilter.trim().toLowerCase();
    const results = data?.results ?? [];
    return (
      results.find((promo) => {
        const locations = normalizeLocations(
          (promo as { display_locations?: unknown }).display_locations
        );
        if (!locations.includes('brand_banner')) return false;
        const listing =
          ((promo as { listing_brand?: string | null }).listing_brand || '').trim().toLowerCase() ||
          (promo.title || '').trim().toLowerCase();
        return listing === needle || listing.startsWith(needle);
      }) ?? null
    );
  }, [config.brandFilter, data?.results]);

  const cmsImage =
    (cmsPromo as { banner_image_url?: string | null; banner_image?: string | null } | null)
      ?.banner_image_url ||
    (cmsPromo as { banner_image?: string | null } | null)?.banner_image ||
    null;
  const cmsHref = ((cmsPromo as { description?: string | null } | null)?.description || '').trim();

  const backgroundImage = cmsImage || config.backgroundImage;
  const href = cmsHref || config.href;
  const label = config.imageAlt ?? `${config.title} collection`;

  const image = backgroundImage ? (
    <CloudinaryImage
      src={backgroundImage}
      alt={config.imageAlt ?? ''}
      preset="brandBanner"
      width={config.imageWidth}
      height={config.imageHeight}
      className="products-brand-banner__image"
      sizes="100vw"
      priority
    />
  ) : null;

  const banner = (
    <section
      className="products-brand-banner"
      aria-label={label}
      style={config.backgroundColor ? { backgroundColor: config.backgroundColor } : undefined}
    >
      {href && image ? (
        <Link href={studioPath(href)} className="products-brand-banner__link" aria-label={label}>
          {image}
        </Link>
      ) : (
        image
      )}
      {!image && canEdit ? (
        <div className="products-brand-banner__empty">
          <p>No {config.brandFilter} banner yet. Click Edit to upload one.</p>
        </div>
      ) : null}
    </section>
  );

  if (!canEdit) return banner;

  return (
    <StudioBlockChrome
      label={`${config.brandFilter} banner`}
      roleHint={studioEdit?.capabilities.roleLabel}
      onEdit={() => studioEdit?.openEditBrandBanner(config.brandFilter)}
    >
      {banner}
    </StudioBlockChrome>
  );
}
