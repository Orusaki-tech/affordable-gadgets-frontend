'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ApiService,
  OpenAPI,
  type PublicFinancingOffer,
  type PublicProduct,
  type PublicProductList,
} from '@/lib/api/generated';
import { apiBaseUrl } from '@/lib/api/openapi';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { MaterialIcon } from '@/components/MaterialIcon';
import { formatPrice } from '@/lib/utils/format';
import { getProductHref } from '@/lib/utils/productRoutes';

const FINANCING_PRODUCTS_PAGE_SIZE = 6;
const FINANCING_PRODUCTS_FETCH_SIZE = 12;

type FinancingPartner = {
  key: string;
  name: string;
  slug?: string;
  logoUrl?: string | null;
};

type FinancingCardData = {
  product: PublicProductList;
  offer: PublicFinancingOffer | null;
};

type PaginatedPublicProductList = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: PublicProductList[];
};

async function publicHeaders(): Promise<Record<string, string>> {
  return {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': '1',
    ...(typeof OpenAPI.HEADERS === 'function'
      ? await OpenAPI.HEADERS({} as never)
      : (OpenAPI.HEADERS ?? {})),
  };
}

async function fetchFinancingProducts(): Promise<PaginatedPublicProductList> {
  OpenAPI.BASE = apiBaseUrl;
  const base = OpenAPI.BASE.replace(/\/+$/, '');
  const qs = new URLSearchParams({
    financing: '1',
    page: '1',
    page_size: String(FINANCING_PRODUCTS_FETCH_SIZE),
    ordering: '-release_date',
  });
  const res = await fetch(`${base}/api/v1/public/products/?${qs.toString()}`, {
    credentials: 'omit',
    headers: await publicHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Financing products request failed: ${res.status}`);
  }
  return res.json();
}

async function fetchActiveFinancingProviders(): Promise<FinancingPartner[]> {
  OpenAPI.BASE = apiBaseUrl;
  const base = OpenAPI.BASE.replace(/\/+$/, '');
  const res = await fetch(`${base}/api/v1/public/financing/providers/`, {
    credentials: 'omit',
    headers: await publicHeaders(),
  });
  if (res.status === 404) return [];
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Financing providers request failed: ${res.status}`);
  }
  const data = (await res.json()) as Array<{
    id?: number;
    name?: string;
    slug?: string;
    logo_url?: string | null;
  }>;
  if (!Array.isArray(data)) return [];
  return data
    .map((p) => ({
      key: p.slug || String(p.id ?? p.name ?? ''),
      name: (p.name || '').trim(),
      slug: p.slug,
      logoUrl: p.logo_url,
    }))
    .filter((p) => p.name);
}

function moneyValue(value?: string | number | null): number | null {
  if (value == null || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatKes(value?: string | number | null): string | null {
  const num = moneyValue(value);
  if (num == null) return null;
  return formatPrice(num);
}

/** Prefer the lowest-deposit active offer with a weekly or monthly installment. */
function pickOffer(offers: PublicFinancingOffer[]): PublicFinancingOffer | null {
  if (!offers.length) return null;
  const ranked = [...offers].sort((a, b) => {
    const da = moneyValue(a.deposit_amount) ?? Number.POSITIVE_INFINITY;
    const db = moneyValue(b.deposit_amount) ?? Number.POSITIVE_INFINITY;
    return da - db;
  });
  return (
    ranked.find(
      (o) =>
        moneyValue(o.weekly_payment) != null || moneyValue(o.monthly_payment) != null
    ) ?? ranked[0]
  );
}

function partnersFromOffers(offers: PublicFinancingOffer[]): FinancingPartner[] {
  const byKey = new Map<string, FinancingPartner>();
  for (const offer of offers) {
    const name = (offer.provider_name || '').trim();
    if (!name) continue;
    const key = offer.provider_slug || String(offer.provider) || name;
    if (byKey.has(key)) continue;
    byKey.set(key, {
      key,
      name,
      slug: offer.provider_slug,
      logoUrl: offer.provider_logo_url,
    });
  }
  return Array.from(byKey.values());
}

async function fetchFinancingCardDetails(
  products: PublicProductList[]
): Promise<{ cards: FinancingCardData[]; partners: FinancingPartner[] }> {
  if (!products.length) return { cards: [], partners: [] };

  OpenAPI.BASE = apiBaseUrl;
  const details = await Promise.all(
    products.map((product) => {
      if (product.id == null) return Promise.resolve(null as PublicProduct | null);
      return ApiService.apiV1PublicProductsRetrieve(product.id).catch(() => null);
    })
  );

  const partnerMap = new Map<string, FinancingPartner>();
  const cards: FinancingCardData[] = products.map((product, index) => {
    const detail = details[index];
    const offers = detail?.financing_offers ?? [];
    for (const partner of partnersFromOffers(offers)) {
      if (!partnerMap.has(partner.key)) partnerMap.set(partner.key, partner);
    }
    return {
      product,
      offer: pickOffer(offers),
    };
  });

  return { cards, partners: Array.from(partnerMap.values()) };
}

function FinancingProductCard({ product, offer }: FinancingCardData) {
  const href = getProductHref(product);
  const deposit = formatKes(offer?.deposit_amount);
  const weekly = formatKes(offer?.weekly_payment);
  const monthly = formatKes(offer?.monthly_payment);
  const retail =
    formatKes(offer?.retail_amount) || formatPrice(product.min_price ?? null);
  const termLabel =
    offer?.term_count && offer?.term_unit
      ? `${offer.term_count} ${offer.term_unit}${offer.term_count === 1 ? '' : 's'}`
      : null;

  return (
    <Link href={href} className="home-financing__product-card">
      <div className="home-financing__product-media">
        {product.primary_image ? (
          <CloudinaryImage
            src={product.primary_image}
            alt={product.product_name || 'Financing device'}
            fill
            className="object-contain p-1.5"
            sizes="72px"
          />
        ) : (
          <span className="home-financing__product-placeholder" aria-hidden>
            <MaterialIcon name="smartphone" className="text-[1.25rem]" />
          </span>
        )}
      </div>
      <div className="home-financing__product-body">
        <p className="home-financing__product-name">{product.product_name}</p>
        <p className="home-financing__product-price">{retail}</p>
        <div className="home-financing__product-terms">
          {deposit ? (
            <span>
              Deposit <strong>{deposit}</strong>
            </span>
          ) : null}
          {weekly ? (
            <span>
              Weekly <strong>{weekly}</strong>
            </span>
          ) : null}
          {monthly ? (
            <span>
              Monthly <strong>{monthly}</strong>
            </span>
          ) : null}
          {!deposit && !weekly && !monthly ? (
            <span className="home-financing__product-meta">Lipa mdogo mdogo</span>
          ) : null}
        </div>
        {termLabel || offer?.provider_name ? (
          <p className="home-financing__product-meta">
            {[offer?.provider_name, termLabel].filter(Boolean).join(' · ')}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function PartnerChip({ partner }: { partner: FinancingPartner }) {
  return (
    <span className="home-financing__partner-chip">
      {partner.logoUrl ? (
        <span className="home-financing__partner-logo">
          <CloudinaryImage
            src={partner.logoUrl}
            alt=""
            fill
            className="object-contain p-0.5"
            sizes="20px"
          />
        </span>
      ) : (
        <MaterialIcon name="account_balance" className="home-financing__partner-icon" />
      )}
      <span className="home-financing__partner-name">{partner.name}</span>
    </span>
  );
}

export function HomeBnplCalculator() {
  const productsQuery = useQuery({
    queryKey: ['products', 'financing', 'homepage'],
    queryFn: fetchFinancingProducts,
    staleTime: 60_000,
  });

  const products = useMemo(() => {
    const results = productsQuery.data?.results ?? [];
    const withImages = results.filter((p) => Boolean(p.primary_image));
    const preferred = withImages.length >= FINANCING_PRODUCTS_PAGE_SIZE ? withImages : results;
    return preferred.slice(0, FINANCING_PRODUCTS_PAGE_SIZE);
  }, [productsQuery.data?.results]);

  const providersQuery = useQuery({
    queryKey: ['financing-providers', 'homepage'],
    queryFn: fetchActiveFinancingProviders,
    staleTime: 60_000,
    retry: false,
  });

  const detailsQuery = useQuery({
    queryKey: ['financing-card-details', 'homepage', products.map((p) => p.id).join(',')],
    queryFn: () => fetchFinancingCardDetails(products),
    enabled: products.length > 0,
    staleTime: 60_000,
  });

  const cards = detailsQuery.data?.cards ?? products.map((product) => ({ product, offer: null }));
  const partners =
    (providersQuery.data?.length ?? 0) > 0
      ? providersQuery.data!
      : (detailsQuery.data?.partners ?? []);

  const isLoading =
    productsQuery.isLoading ||
    (products.length > 0 && detailsQuery.isLoading) ||
    (providersQuery.isLoading && partners.length === 0);

  if (!isLoading && (productsQuery.isError || products.length === 0)) {
    return null;
  }

  return (
    <section className="ag-bleed ag-bleed--dark ag-bleed--spaced home-financing">
      <div className="ag-bleed__inner home-financing__layout">
        <div className="home-financing__intro">
          <div className="home-financing__copy">
            <p className="ag-type-eyebrow inline-flex items-center gap-1.5 text-promo-lime">
              <MaterialIcon name="payments" className="text-[0.875rem]" />
              Lipa Mdogo Mdogo Available
            </p>
            <h2 className="ag-type-h2 ag-type-h2--on-dark mt-2">
              Buy Now, Pay Later with certified partners
            </h2>
            <p className="ag-type-body mt-3 text-white/75">
              Get instant device financing through certified Kenyan fintech partners. Browse phones
              with live offers — final deposit and weekly terms are confirmed on each financing page.
            </p>
          </div>

          <div className="home-financing__aside">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Financing Partners
              </p>
              {isLoading && partners.length === 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <span
                      key={i}
                      className="home-financing__partner-chip home-financing__skeleton home-financing__skeleton-chip"
                    />
                  ))}
                </div>
              ) : partners.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {partners.map((partner) => (
                    <PartnerChip key={partner.key} partner={partner} />
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-white/50">
                  Partners are listed on each financing device.
                </p>
              )}
            </div>

            <Link href="/financing" className="ag-btn ag-btn--lime">
              Browse financing devices
              <MaterialIcon name="arrow_forward" className="text-[1.125rem]" />
            </Link>
          </div>
        </div>

        <div className="home-financing__panel">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Available financing devices
          </p>
          <div className="home-financing__products">
            {isLoading && cards.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="home-financing__product-card home-financing__skeleton" />
                ))
              : cards.map((card) => (
                  <FinancingProductCard
                    key={card.product.id}
                    product={card.product}
                    offer={card.offer}
                  />
                ))}
          </div>
          <p className="mt-3 text-[0.6875rem] text-white/50">
            Estimates and eligibility are confirmed by financing partners on the financing page.
          </p>
        </div>
      </div>
    </section>
  );
}
