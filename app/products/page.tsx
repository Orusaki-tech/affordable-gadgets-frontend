import { Suspense } from 'react';
import { Metadata } from 'next';
import { ProductsPage } from '@/components/ProductsPage';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { StructuredData } from '@/components/StructuredData';
import { brandConfig } from '@/lib/config/brand';
import { getBrandBannerTitleForMetadata } from '@/lib/config/products-brand-banners';
import { resolveIndexableProductListing } from '@/lib/seo/indexableProductListings';

export const revalidate = 3600;

const BASE_TITLE =
  'Affordable Phones, Laptops & Electronics in Kenya | Affordable Gadgets';
const BASE_DESCRIPTION =
  'Shop affordable phones, laptops, tablets, iPads and accessories in Kenya. Compare specs, prices and payment options and buy online or pick up in Nairobi CBD.';

const TYPE_TITLES: Record<string, string> = {
  PH: 'Affordable Phones in Kenya',
  LT: 'Affordable Laptops in Kenya',
  TB: 'Affordable Tablets & iPads in Kenya',
  AC: 'Affordable Accessories in Kenya',
};

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

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<ProductsSearchParams>;
}): Promise<Metadata> {
  const sp = (await searchParams) ?? {};
  const page = asNumber(sp.page);
  const suffix = page && page > 1 ? ` (Page ${page})` : '';
  const promotionId = asString(sp.promotion);
  const marketing = resolveIndexableProductListing(sp);
  const brandFilter =
    marketing?.brandFilter || asString(sp.brand_filter) || asString(sp.brand) || '';
  const brandTitle =
    !promotionId && brandFilter ? getBrandBannerTitleForMetadata(brandFilter) : undefined;
  const typeTitle =
    !brandTitle && marketing?.productType ? TYPE_TITLES[marketing.productType] : undefined;
  const title = brandTitle
    ? `${brandTitle} Deals in Kenya | Affordable Gadgets${suffix}`
    : typeTitle
      ? `${typeTitle} | Affordable Gadgets${suffix}`
      : `${BASE_TITLE}${suffix}`;

  // Unfiltered /products (and paginated /products?page=N) stay indexable.
  if (!marketing && !brandFilter && !asString(sp.type) && !promotionId) {
    const hasOtherFilters = Object.entries(sp).some(([key, value]) => {
      if (key === 'page') return false;
      if (value === undefined) return false;
      if (Array.isArray(value)) return value.some(Boolean);
      return Boolean(String(value).trim());
    });
    if (!hasOtherFilters) {
      const canonical = page && page > 1 ? `/products?page=${page}` : '/products';
      return {
        title,
        description: BASE_DESCRIPTION,
        alternates: { canonical },
      };
    }
  }

  // Primary nav marketing landings: self-canonical + indexable (page 1 only).
  if (marketing && (!page || page <= 1)) {
    return {
      title,
      description: BASE_DESCRIPTION,
      alternates: { canonical: marketing.canonicalPath },
    };
  }

  // Search/sort/price/etc. and page>1 marketing variants: noindex, point at hub.
  const canonical =
    marketing && page && page > 1 ? marketing.canonicalPath : '/products';
  return {
    title,
    description: BASE_DESCRIPTION,
    alternates: { canonical },
    robots: { index: false, follow: true },
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
