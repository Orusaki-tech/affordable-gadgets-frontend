'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ApiService,
  OpenAPI,
  type PublicFinancingOffer,
  type PublicProductList,
} from '@/lib/api/generated';
import { apiBaseUrl } from '@/lib/api/openapi';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { MaterialIcon } from '@/components/MaterialIcon';
import { formatPrice } from '@/lib/utils/format';
import { getProductHref } from '@/lib/utils/productRoutes';

const FINANCING_PRODUCTS_PAGE_SIZE = 6;
const PARTNER_SAMPLE_SIZE = 6;

type FinancingPartner = {
  key: string;
  name: string;
  slug?: string;
  logoUrl?: string | null;
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
    page_size: String(FINANCING_PRODUCTS_PAGE_SIZE),
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

async function fetchPartnersFromProductOffers(
  products: PublicProductList[]
): Promise<FinancingPartner[]> {
  const sample = products.slice(0, PARTNER_SAMPLE_SIZE);
  if (!sample.length) return [];

  OpenAPI.BASE = apiBaseUrl;
  const details = await Promise.all(
    sample.map((product) => {
      if (product.id == null) return Promise.resolve(null);
      return ApiService.apiV1PublicProductsRetrieve(product.id).catch(() => null);
    })
  );

  const byKey = new Map<string, FinancingPartner>();
  for (const detail of details) {
    if (!detail) continue;
    for (const partner of partnersFromOffers(detail.financing_offers ?? [])) {
      if (!byKey.has(partner.key)) byKey.set(partner.key, partner);
    }
  }
  return Array.from(byKey.values());
}

function FinancingProductCard({ product }: { product: PublicProductList }) {
  const href = getProductHref(product);
  const price = formatPrice(product.min_price ?? null);

  return (
    <Link href={href} className="home-financing__product-card">
      <div className="home-financing__product-media">
        {product.primary_image ? (
          <CloudinaryImage
            src={product.primary_image}
            alt={product.product_name || 'Financing device'}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 42vw, 140px"
          />
        ) : (
          <span className="home-financing__product-placeholder" aria-hidden>
            <MaterialIcon name="smartphone" className="text-[1.5rem]" />
          </span>
        )}
      </div>
      <div className="home-financing__product-body">
        <p className="home-financing__product-name">{product.product_name}</p>
        <p className="home-financing__product-price">{price}</p>
        <p className="home-financing__product-meta">Lipa mdogo mdogo</p>
      </div>
    </Link>
  );
}

function PartnerChip({ partner }: { partner: FinancingPartner }) {
  return (
    <span className="ag-tag ag-tag--on-dark home-financing__partner-chip">
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
      ) : null}
      {partner.name}
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
    return (withImages.length >= 4 ? withImages : results).slice(0, FINANCING_PRODUCTS_PAGE_SIZE);
  }, [productsQuery.data?.results]);

  const providersQuery = useQuery({
    queryKey: ['financing-providers', 'homepage'],
    queryFn: fetchActiveFinancingProviders,
    staleTime: 60_000,
    retry: false,
  });

  const offerPartnersQuery = useQuery({
    queryKey: [
      'financing-partners-from-offers',
      'homepage',
      products.map((p) => p.id).join(','),
    ],
    queryFn: () => fetchPartnersFromProductOffers(products),
    enabled:
      products.length > 0 &&
      !providersQuery.isLoading &&
      (providersQuery.isError || (providersQuery.data?.length ?? 0) === 0),
    staleTime: 60_000,
  });

  const partners =
    (providersQuery.data?.length ?? 0) > 0
      ? providersQuery.data!
      : (offerPartnersQuery.data ?? []);

  const isLoading =
    productsQuery.isLoading ||
    providersQuery.isLoading ||
    (offerPartnersQuery.isFetching && partners.length === 0);

  if (!isLoading && (productsQuery.isError || products.length === 0)) {
    return null;
  }

  return (
    <section className="ag-bleed ag-bleed--dark ag-bleed--spaced home-financing">
      <div className="ag-bleed__inner home-financing__layout">
        <div>
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

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Financing Partners
            </p>
            {isLoading && partners.length === 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <span
                    key={i}
                    className="ag-tag ag-tag--on-dark home-financing__skeleton home-financing__skeleton-chip"
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

          <Link href="/financing" className="ag-btn ag-btn--lime mt-6">
            Browse financing devices
            <MaterialIcon name="arrow_forward" className="text-[1.125rem]" />
          </Link>
        </div>

        <div className="home-financing__panel">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Available financing devices
          </p>
          <div className="home-financing__products">
            {isLoading && products.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="home-financing__product-card home-financing__skeleton" />
                ))
              : products.map((product) => (
                  <FinancingProductCard key={product.id} product={product} />
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
