'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { ProductCarousel } from '@/components/ProductCarousel';
import { OpenAPI } from '@/lib/api/generated';
import { apiBaseUrl } from '@/lib/api/openapi';
import { getPlaceholderProductImage } from '@/lib/utils/placeholders';
import {
  IPHONE_BATTERY_REPLACEMENT_PRICES,
  findCatalogImageForBatteryModel,
  formatRepairKes,
  repairBatteryBookingHref,
  type CatalogImageSource,
} from '@/lib/repair/iphoneBatteryPrices';

async function fetchIphoneCatalogImages(): Promise<CatalogImageSource[]> {
  OpenAPI.BASE = apiBaseUrl;
  const base = OpenAPI.BASE.replace(/\/+$/, '');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': '1',
    ...(typeof OpenAPI.HEADERS === 'function'
      ? await OpenAPI.HEADERS({} as never)
      : (OpenAPI.HEADERS ?? {})),
  };
  const res = await fetch(
    `${base}/api/v1/public/products/?search=iPhone&page_size=100&page=1`,
    { credentials: 'omit', headers, cache: 'no-store' }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: CatalogImageSource[] };
  return (data.results ?? []).filter((p) =>
    /iphone/i.test(p.product_name || '')
  );
}

export function IphoneBatteryPriceList() {
  const [query, setQuery] = useState('');
  const catalogQuery = useQuery({
    queryKey: ['repair', 'iphone-catalog-images'],
    queryFn: fetchIphoneCatalogImages,
    staleTime: 10 * 60 * 1000,
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = !q
      ? IPHONE_BATTERY_REPLACEMENT_PRICES
      : IPHONE_BATTERY_REPLACEMENT_PRICES.filter((row) =>
          row.model.toLowerCase().includes(q)
        );
    const products = catalogQuery.data ?? [];
    return base.map((row) => ({
      ...row,
      imageUrl:
        findCatalogImageForBatteryModel(row.model, products) ||
        getPlaceholderProductImage(row.model),
    }));
  }, [query, catalogQuery.data]);

  return (
    <section
      id="iphone-battery-prices"
      className="repair-page__prices"
      aria-labelledby="iphone-battery-prices-title"
    >
      <div className="repair-page__prices-header">
        <div>
          <p className="repair-page__prices-eyebrow">Apple · Battery</p>
          <h2 id="iphone-battery-prices-title" className="repair-page__prices-title">
            iPhone battery replacement prices
          </h2>
          <p className="repair-page__prices-sub">
            Listed rates for drop-off at our Nairobi CBD shop. Confirm on WhatsApp before we start
            work — parts and labour may vary after inspection.
          </p>
        </div>
        <label className="repair-page__prices-search">
          <span className="sr-only">Search iPhone model</span>
          <input
            type="search"
            className="checkout-modal__input"
            placeholder="Search model… e.g. 13 Pro"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>
      </div>

      {rows.length > 0 ? (
        <div className="repair-page__prices-carousel">
          <ProductCarousel
            itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
            showNavigation
            alwaysShowNavigation
            autoPlay={rows.length > 4}
            autoPlayInterval={6500}
          >
            {rows.map((row) => (
              <article
                key={row.model}
                className="product-card product-card--featured repair-page__battery-card"
              >
                <div className="product-card__media product-card__media--featured">
                  <CloudinaryImage
                    src={row.imageUrl}
                    alt={row.model}
                    preset="productThumb"
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw"
                    className="product-card__image product-card__image--primary product-card__image--featured"
                    fill
                  />
                  <span className="repair-page__battery-badge">Battery</span>
                </div>
                <div className="product-card__footer product-card__footer--featured">
                  <div className="product-card__footer-bar">
                    <p className="product-card__name product-card__name--featured">{row.model}</p>
                    <Link
                      href={repairBatteryBookingHref(row.model)}
                      className="product-card__buy-btn product-card__buy-btn--featured"
                    >
                      Book
                    </Link>
                  </div>
                  <div className="repair-page__battery-price">
                    <span className="repair-page__battery-price-label">Replacement</span>
                    <span className="repair-page__battery-price-value">
                      {formatRepairKes(row.priceKes)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </ProductCarousel>
        </div>
      ) : (
        <p className="repair-page__prices-empty">No models match that search.</p>
      )}
    </section>
  );
}
