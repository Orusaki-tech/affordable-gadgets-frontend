import { Suspense } from 'react';
import { Metadata } from 'next';
import { ProductsPage } from '@/components/ProductsPage';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { StructuredData } from '@/components/StructuredData';
import { brandConfig } from '@/lib/config/brand';
import { getBrandBannerTitleForMetadata } from '@/lib/config/products-brand-banners';

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
    if (key === 'focusSearch' || key === 'openFilters') continue;
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
  const promotionId = asString(sp.promotion);
  const brandFilter = asString(sp.brand_filter) || asString(sp.brand) || '';
  const brandTitle = !promotionId ? getBrandBannerTitleForMetadata(brandFilter) : undefined;
  const title = brandTitle
    ? `${brandTitle} Deals in Kenya | Affordable Gadgets${suffix}`
    : `${BASE_TITLE}${suffix}`;
  return {
    title,
    description: BASE_DESCRIPTION,
    alternates: {
      canonical: buildCanonicalFromSearchParams(sp),
    },
  };
}

export default function ProductsListingPage() {
  // Product list is fetched once client-side (ProductsPage) to avoid duplicate API load.

  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData
        type="BreadcrumbList"
        breadcrumbs={[
          { name: 'Home', url: brandConfig.siteUrl },
          { name: 'Products', url: `${brandConfig.siteUrl}/products` },
        ]}
      />
      <Suspense
        fallback={
          <div className="site-header-wrapper">
            <HeaderWithAnnouncement />
          </div>
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>

      <main className="flex-1 pb-8">
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
