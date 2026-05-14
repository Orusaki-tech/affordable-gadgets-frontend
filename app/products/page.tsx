import { Suspense } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { ProductsPage } from '@/components/ProductsPage';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { StructuredData } from '@/components/StructuredData';
import { brandConfig } from '@/lib/config/brand';
import { ApiService } from '@/lib/api/generated';

export const revalidate = 3600;

const BASE_TITLE =
  'Affordable Phones, Laptops & Electronics in Kenya | Affordable Gadgets';
const BASE_DESCRIPTION =
  'Shop affordable phones, laptops, tablets, iPads and accessories in Kenya. Compare specs, prices and payment options and buy online or pick up in Nairobi CBD.';

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asNumber(value: string | string[] | undefined) {
  const str = asString(value);
  if (!str) return undefined;
  const num = Number(str);
  return Number.isFinite(num) ? num : undefined;
}

type ProductsSearchParams = Record<string, string | string[] | undefined>;

function buildCanonicalFromSearchParams(sp: ProductsSearchParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value === undefined) continue;
    if (key === 'focusSearch') continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return `/products${qs ? `?${qs}` : ''}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<ProductsSearchParams>;
}): Promise<Metadata> {
  const sp = (await searchParams) ?? {};
  const page = asNumber(sp.page);
  const suffix = page && page > 1 ? ` (Page ${page})` : '';
  return {
    title: `${BASE_TITLE}${suffix}`,
    description: BASE_DESCRIPTION,
    alternates: {
      canonical: buildCanonicalFromSearchParams(sp),
    },
  };
}

export default async function ProductsListingPage({
  searchParams,
}: {
  searchParams?: Promise<ProductsSearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const brandFilter = asString(sp.brand_filter);
  const search = asString(sp.search);
  const ordering = asString(sp.ordering);
  const type = asString(sp.type);
  const minPrice = asNumber(sp.min_price);
  const maxPrice = asNumber(sp.max_price);
  const promotion = asNumber(sp.promotion);
  const page = asNumber(sp.page) ?? 1;

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, v));
    } else {
      qs.set(key, value);
    }
  }
  const productsUrl = `${brandConfig.siteUrl}/products${qs.toString() ? `?${qs.toString()}` : ''}`;

  let results: Array<{ product_name: string; slug?: string; primary_image?: string | null }> = [];
  try {
    const data = await ApiService.apiV1PublicProductsList(
      brandFilter,
      undefined,
      undefined,
      maxPrice,
      minPrice,
      ordering,
      page,
      20,
      promotion,
      search,
      undefined,
      type
    );
    results = Array.isArray(data?.results) ? (data.results as typeof results) : [];
  } catch {
    results = [];
  }

  const itemListItems = results
    .map((p) => {
      const slug = p.slug;
      if (!slug) return null;
      return {
        name: p.product_name,
        url: `${brandConfig.siteUrl}/products/${slug}`,
        image: p.primary_image ?? null,
        type: 'Product' as const,
      };
    })
    .filter(Boolean) as Array<{ name: string; url: string; image?: string | null; type: 'Product' }>;

  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData
        type="BreadcrumbList"
        breadcrumbs={[
          { name: 'Home', url: brandConfig.siteUrl },
          { name: 'Products', url: `${brandConfig.siteUrl}/products` },
        ]}
      />
      {itemListItems.length > 0 && (
        <StructuredData
          type="ItemList"
          itemList={{
            name: `${brandConfig.name} products`,
            url: productsUrl,
            items: itemListItems,
          }}
        />
      )}
      <Suspense
        fallback={
          <div className="site-header-wrapper">
            <HeaderWithAnnouncement />
          </div>
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>

      <main className="flex-1 container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-96" />
              ))}
            </div>
          }
        >
          <ProductsPage />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}







