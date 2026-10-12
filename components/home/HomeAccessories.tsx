'use client';

import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { ProductCarousel } from '@/components/ProductCarousel';
import { useProducts } from '@/lib/hooks/useProducts';
import type { PublicProductList } from '@/lib/api/generated';
import { getProductHref } from '@/lib/utils/productRoutes';
import { formatPrice } from '@/lib/utils/format';

const ACCESSORIES_PAGE_SIZE = 24;

function isWatchProduct(product: PublicProductList): boolean {
  const name = (product.product_name || '').toLowerCase();
  return /\bwatch\b/.test(name);
}

/** Prefer a brand mix so one brand doesn't dominate the strip. */
function pickAccessoryProducts(
  products: PublicProductList[],
  limit = ACCESSORIES_PAGE_SIZE
): PublicProductList[] {
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
      if (brand === 'sony') return 3;
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

/** Homepage accessories strip — AirPods, buds, pencils, and more (excludes watches). */
export function HomeAccessories() {
  const { data, isLoading, isError } = useProducts({
    type: 'AC',
    page_size: 48,
    page: 1,
  });

  const products = pickAccessoryProducts(
    (data?.results ?? []).filter((product) => !isWatchProduct(product))
  );

  if (!isLoading && (isError || products.length === 0)) {
    return null;
  }

  return (
    <section
      id="accessories"
      className="ag-section ag-section--tight scroll-mt-28"
      aria-labelledby="home-accessories-title"
    >
      <div className="home-section-panel">
        <div className="special-offers">
          {isLoading ? (
            <>
              <h2 id="home-accessories-title" className="special-offers__title section-label">
                Accessories
              </h2>
              <div className="special-offers__grid special-offers__grid--loading">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="special-offers__card special-offers__card--loading" />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <h2
                  id="home-accessories-title"
                  className="special-offers__title section-label !mb-0"
                >
                  Accessories
                </h2>
                <Link
                  href="/products?type=AC"
                  className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Browse all accessories
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
            </>
          )}
        </div>
      </div>
    </section>
  );
}
