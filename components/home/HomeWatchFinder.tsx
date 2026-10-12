'use client';

import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { ProductCard } from '@/components/ProductCard';
import { ProductCarousel } from '@/components/ProductCarousel';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { StudioPromoTile } from '@/components/studio/StudioPromoTile';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import { useProducts } from '@/lib/hooks/useProducts';
import { usePromotions } from '@/lib/hooks/usePromotions';
import type { PublicProductList, PublicPromotion } from '@/lib/api/generated';
import { getPromotionHref } from '@/lib/utils/promotionRoutes';

const LOCATION = 'watch_offers' as const;
const WATCH_PAGE_SIZE = 24;

function normalizeLocations(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function isWatchProduct(product: PublicProductList): boolean {
  const name = (product.product_name || '').toLowerCase();
  return /\bwatch\b/.test(name);
}

/** Prefer a brand mix so Apple doesn't bury Samsung / Google / others. */
function pickWatchProducts(products: PublicProductList[], limit = WATCH_PAGE_SIZE): PublicProductList[] {
  const byBrand = new Map<string, PublicProductList[]>();
  for (const product of products) {
    const key = (product.brand || 'other').trim().toLowerCase() || 'other';
    const list = byBrand.get(key) ?? [];
    list.push(product);
    byBrand.set(key, list);
  }

  const brandOrder = [...byBrand.keys()].sort((a, b) => {
    const rank = (brand: string) => {
      if (brand === 'apple') return 0;
      if (brand === 'samsung') return 1;
      if (brand === 'google') return 2;
      return 10;
    };
    return rank(a) - rank(b) || a.localeCompare(b);
  });

  const picked: PublicProductList[] = [];
  const seen = new Set<number>();
  let progressed = true;
  while (picked.length < limit && progressed) {
    progressed = false;
    for (const brand of brandOrder) {
      const list = byBrand.get(brand);
      if (!list?.length) continue;
      const next = list.shift();
      if (!next?.id || seen.has(next.id)) continue;
      seen.add(next.id);
      picked.push(next);
      progressed = true;
      if (picked.length >= limit) break;
    }
  }
  return picked;
}

/**
 * Homepage watch strip: live catalog watches by default.
 * Optional Studio `watch_offers` creatives override when curated.
 */
export function HomeWatchFinder() {
  const studioEdit = useStudioEditOptional();
  const canManage = Boolean(studioEdit?.capabilities.canEditPromotions);

  const productsQuery = useProducts({
    search: 'watch',
    page_size: WATCH_PAGE_SIZE,
    page: 1,
  });
  const promotionsQuery = usePromotions({
    page_size: WATCH_PAGE_SIZE,
    display_location: LOCATION,
  });

  const promotions = (promotionsQuery.data?.results || []).filter((promo: PublicPromotion) => {
    const locations = normalizeLocations(promo.display_locations);
    if (locations.length === 0) return false;
    return locations.includes(LOCATION);
  });

  const products = pickWatchProducts((productsQuery.data?.results ?? []).filter(isWatchProduct));

  // Curated creatives win only when Studio has placed live ones; otherwise show stock.
  const usePromos = !promotionsQuery.isLoading && promotions.length > 0;
  const isLoading = usePromos
    ? promotionsQuery.isLoading
    : productsQuery.isLoading && products.length === 0;

  const openManager = () => studioEdit?.openEditWatchOffers();

  if (!isLoading && products.length === 0 && promotions.length === 0 && !canManage) {
    return null;
  }

  const body = (() => {
    if (isLoading) {
      return (
        <div className="special-offers">
          <h2 id="home-watch-offers-title" className="special-offers__title section-label">
            Apple, Samsung &amp; Pixel Watches
          </h2>
          <div className="special-offers__grid special-offers__grid--loading">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="special-offers__card special-offers__card--loading" />
            ))}
          </div>
        </div>
      );
    }

    if (usePromos) {
      return (
        <div className="special-offers">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 id="home-watch-offers-title" className="special-offers__title section-label !mb-0">
              Apple, Samsung &amp; Pixel Watches
            </h2>
            <Link
              href="/products?type=AC&search=watch"
              className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
            >
              Browse all watches
            </Link>
          </div>
          <ProductCarousel
            itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
            showNavigation
            showPagination={false}
            autoPlay
          >
            {promotions.map((promotion: PublicPromotion, index) => {
              const promotionImageSrc = promotion.banner_image_url || promotion.banner_image;
              const href = getPromotionHref(promotion);
              return (
                <StudioPromoTile
                  key={promotion.id ?? `${promotion.title}-${index}`}
                  promotionId={promotion.id}
                  title={promotion.title}
                  href={href}
                  className="special-offers__promo"
                  onRemove={
                    canManage && promotion.id
                      ? () => void studioEdit?.removeWatchOfferPromotion(promotion.id!)
                      : undefined
                  }
                >
                  <div className="special-offers__promo-media">
                    {promotionImageSrc ? (
                      <CloudinaryImage
                        src={promotionImageSrc}
                        alt={promotion.title}
                        preset="promoTile"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        priority={false}
                        loading={index < 2 ? 'eager' : 'lazy'}
                        className="special-offers__promo-image"
                        fill
                      />
                    ) : null}
                  </div>
                </StudioPromoTile>
              );
            })}
          </ProductCarousel>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="special-offers">
          <h2 id="home-watch-offers-title" className="special-offers__title section-label">
            Apple, Samsung &amp; Pixel Watches
          </h2>
          <div className="special-offers__empty">
            <p className="special-offers__empty-text">
              No watches in stock right now. You can still curate promo creatives in Studio.
            </p>
            {canManage ? (
              <button type="button" className="special-offers__empty-link" onClick={openManager}>
                Choose watch offers
              </button>
            ) : (
              <Link href="/products?type=AC&search=watch" className="special-offers__empty-link">
                Browse watches
              </Link>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="special-offers">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 id="home-watch-offers-title" className="special-offers__title section-label !mb-0">
            Apple, Samsung &amp; Pixel Watches
          </h2>
          <Link
            href="/products?type=AC&search=watch"
            className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            Browse all watches
          </Link>
        </div>
        <ProductCarousel
          itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
          showNavigation
          showPagination={false}
          autoPlay={false}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id ?? product.slug}
              product={product}
              variant="featured"
              studioAllowDelete={false}
            />
          ))}
        </ProductCarousel>
        {canManage ? (
          <p className="mt-4 text-xs text-secondary">
            Showing live catalog watches. Optional:{' '}
            <button
              type="button"
              className="font-semibold text-primary underline-offset-2 hover:underline"
              onClick={openManager}
            >
              curate promo creatives
            </button>{' '}
            to replace this strip with designed tiles.
          </p>
        ) : null}
      </div>
    );
  })();

  const section = (
    <section
      id="smart-watches"
      className="ag-section ag-section--tight scroll-mt-28"
      aria-labelledby="home-watch-offers-title"
    >
      <div className="home-section-panel">{body}</div>
    </section>
  );

  if (!canManage) return section;

  return (
    <StudioBlockChrome
      label="Watch offers"
      roleHint={studioEdit?.capabilities.roleLabel}
      onEdit={openManager}
    >
      {section}
    </StudioBlockChrome>
  );
}
