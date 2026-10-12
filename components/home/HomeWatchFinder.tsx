'use client';

import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { ProductCarousel } from '@/components/ProductCarousel';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import { useProducts } from '@/lib/hooks/useProducts';
import type { PublicProductList } from '@/lib/api/generated';
import { getProductHref } from '@/lib/utils/productRoutes';
import { formatPrice } from '@/lib/utils/format';

const WATCH_PAGE_SIZE = 24;

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
 * Homepage watch strip — live catalog watches (all brands).
 * Studio Watch offers remains available for optional promo creatives later.
 */
export function HomeWatchFinder() {
  const studioEdit = useStudioEditOptional();
  const canManage = Boolean(studioEdit?.capabilities.canEditPromotions);

  const { data, isLoading, isError } = useProducts({
    search: 'watch',
    page_size: WATCH_PAGE_SIZE,
    page: 1,
  });

  const products = pickWatchProducts((data?.results ?? []).filter(isWatchProduct));
  const openManager = () => studioEdit?.openEditWatchOffers();

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

    if (isError || products.length === 0) {
      return (
        <div className="special-offers">
          <h2 id="home-watch-offers-title" className="special-offers__title section-label">
            Apple, Samsung &amp; Pixel Watches
          </h2>
          <div className="special-offers__empty">
            <p className="special-offers__empty-text">
              {isError
                ? 'Could not load watches right now.'
                : 'No watches in stock right now.'}
            </p>
            <Link href="/products?type=AC&search=watch" className="special-offers__empty-link">
              Browse watches
            </Link>
            {canManage ? (
              <>
                {' · '}
                <button type="button" className="special-offers__empty-link" onClick={openManager}>
                  Curate promo tiles
                </button>
              </>
            ) : null}
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
          {products.map((product, index) => {
            const href = getProductHref(product);
            const imageSrc = product.primary_image;
            const price =
              product.min_price != null ? formatPrice(product.min_price) : null;

            return (
              <Link
                key={product.id ?? product.slug ?? index}
                href={href}
                className="special-offers__promo"
                aria-label={product.product_name}
              >
                <div className="special-offers__promo-media">
                  {imageSrc ? (
                    <CloudinaryImage
                      src={imageSrc}
                      alt={product.product_name}
                      preset="promoTile"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      priority={false}
                      loading={index < 2 ? 'eager' : 'lazy'}
                      className="special-offers__promo-image"
                      fill
                    />
                  ) : null}
                </div>
                <span className="sr-only">
                  {product.product_name}
                  {price ? ` — ${price}` : ''}
                </span>
              </Link>
            );
          })}
        </ProductCarousel>
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
