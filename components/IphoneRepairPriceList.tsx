'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { OpenAPI } from '@/lib/api/generated';
import { apiBaseUrl } from '@/lib/api/openapi';
import { getPlaceholderProductImage } from '@/lib/utils/placeholders';
import {
  IPHONE_BATTERY_REPLACEMENT_PRICES,
  IPHONE_SCREEN_GRADE_LABELS,
  IPHONE_SCREEN_REPLACEMENT_PRICES,
  findCatalogImageForRepairModel,
  formatRepairKes,
  repairBookingHref,
  type CatalogImageSource,
  type IphoneRepairPrice,
  type IphoneRepairService,
  type IphoneScreenGrade,
} from '@/lib/repair/iphoneRepairPrices';

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
  return (data.results ?? []).filter((p) => /iphone/i.test(p.product_name || ''));
}

const SERVICE_META: Record<
  IphoneRepairService,
  {
    label: string;
    eyebrow: string;
    title: string;
    badge: string;
    prices: readonly IphoneRepairPrice[];
  }
> = {
  battery: {
    label: 'Battery',
    eyebrow: 'Apple · Battery',
    title: 'iPhone battery replacement prices',
    badge: 'Battery',
    prices: IPHONE_BATTERY_REPLACEMENT_PRICES,
  },
  screen: {
    label: 'Screen',
    eyebrow: 'Apple · Screen',
    title: 'iPhone screen replacement prices',
    badge: 'Screen',
    prices: IPHONE_SCREEN_REPLACEMENT_PRICES,
  },
};

const SCREEN_GRADE_FILTERS: Array<{ key: 'all' | IphoneScreenGrade; label: string }> = [
  { key: 'all', label: 'All grades' },
  { key: 'HX', label: 'HX original' },
  { key: 'DD', label: 'DD original' },
  { key: 'GX', label: 'GX original' },
];

export function IphoneRepairPriceList() {
  const [service, setService] = useState<IphoneRepairService>('battery');
  const [screenGrade, setScreenGrade] = useState<'all' | IphoneScreenGrade>('all');
  const [query, setQuery] = useState('');
  const catalogQuery = useQuery({
    queryKey: ['repair', 'iphone-catalog-images'],
    queryFn: fetchIphoneCatalogImages,
    staleTime: 10 * 60 * 1000,
  });

  const meta = SERVICE_META[service];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = meta.prices;
    if (service === 'screen' && screenGrade !== 'all') {
      base = base.filter((row) => row.screenGrade === screenGrade);
    }
    if (q) {
      base = base.filter(
        (row) =>
          row.model.toLowerCase().includes(q) ||
          (row.screenGrade && row.screenGrade.toLowerCase().includes(q))
      );
    }
    const products = catalogQuery.data ?? [];
    return base.map((row) => ({
      ...row,
      imageUrl:
        findCatalogImageForRepairModel(row.model, products) ||
        getPlaceholderProductImage(row.model),
    }));
  }, [query, meta.prices, catalogQuery.data, service, screenGrade]);

  return (
    <section
      id="iphone-repair-prices"
      className="repair-page__prices"
      aria-labelledby="iphone-repair-prices-title"
    >
      <div className="repair-page__prices-header">
        <div>
          <p className="repair-page__prices-eyebrow">{meta.eyebrow}</p>
          <h2 id="iphone-repair-prices-title" className="repair-page__prices-title">
            {meta.title}
          </h2>
          <p className="repair-page__prices-sub">
            {service === 'screen'
              ? 'Original HX, DD, and GX screens. Diagnosable units may show as used after install. Confirm on WhatsApp before we start work.'
              : 'Listed rates for drop-off at our Nairobi CBD shop. Confirm on WhatsApp before we start work — parts and labour may vary after inspection.'}
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

      <div className="repair-page__prices-tabs" role="tablist" aria-label="Repair type">
        {(['battery', 'screen'] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={service === key}
            className={`repair-page__prices-tab${service === key ? ' repair-page__prices-tab--active' : ''}`}
            onClick={() => {
              setService(key);
              setQuery('');
              setScreenGrade('all');
            }}
          >
            {SERVICE_META[key].label}
          </button>
        ))}
      </div>

      {service === 'screen' ? (
        <div className="repair-page__prices-grades" role="group" aria-label="Screen grade">
          {SCREEN_GRADE_FILTERS.map((grade) => (
            <button
              key={grade.key}
              type="button"
              className={`repair-page__prices-grade${screenGrade === grade.key ? ' repair-page__prices-grade--active' : ''}`}
              onClick={() => setScreenGrade(grade.key)}
            >
              {grade.label}
            </button>
          ))}
        </div>
      ) : null}

      {rows.length > 0 ? (
        <ul className="repair-page__prices-grid">
          {rows.map((row) => {
            const gradeLabel = row.screenGrade
              ? IPHONE_SCREEN_GRADE_LABELS[row.screenGrade]
              : null;
            return (
              <li key={`${service}-${row.screenGrade || 'na'}-${row.model}`}>
                <article className="repair-page__price-card">
                  <div className="repair-page__price-card-media">
                    <CloudinaryImage
                      src={row.imageUrl}
                      alt={row.model}
                      preset="productThumb"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 180px"
                      className="repair-page__price-card-image"
                      fill
                    />
                    <span className="repair-page__price-card-badge">
                      {gradeLabel || meta.badge}
                    </span>
                  </div>
                  <div className="repair-page__price-card-body">
                    <h3 className="repair-page__price-card-name">{row.model}</h3>
                    {gradeLabel ? (
                      <p className="repair-page__price-card-grade">{gradeLabel}</p>
                    ) : null}
                    <p className="repair-page__price-card-price">
                      {formatRepairKes(row.priceKes)}
                    </p>
                    <Link
                      href={repairBookingHref(row.model, service, row.screenGrade)}
                      className="repair-page__price-card-book"
                    >
                      Book
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="repair-page__prices-empty">No models match that search.</p>
      )}
    </section>
  );
}

/** @deprecated use IphoneRepairPriceList */
export function IphoneBatteryPriceList() {
  return <IphoneRepairPriceList />;
}
