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

export const metadata: Metadata = {
  title: 'Products',
  description: 'Browse phones, laptops, tablets, iPads, and accessories with filters for brand, price, and category.',
  alternates: {
    canonical: '/products',
  },
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

export default async function ProductsListingPage({
  searchParams,
}: {
  searchParams?: ProductsSearchParams;
}) {
  const sp = searchParams ?? {};
  const brandFilter = asString(sp.brand_filter);
  const search = asString(sp.search);
  const ordering = asString(sp.ordering);
  const type = asString(sp.type);
  const minPrice = asNumber(sp.min_price);
  const maxPrice = asNumber(sp.max_price);
  const promotion = asNumber(sp.promotion);

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
      maxPrice,
      minPrice,
      ordering,
      1,
      12,
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
        <section className="mx-auto mb-8 max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Affordable Gadgets Products
            </h1>
          </header>
          <p className="text-base leading-7 text-gray-600 sm:text-lg">
            Explore the full Affordable Gadgets Ke catalog with powerful search and smart filters. Compare
            the latest phones, laptops, tablets, iPads, and accessories side by side, then narrow results by
            brand, device type, storage, and price range to quickly discover the best fit for your budget in
            Kenya.
          </p>
          <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
            Start with the options below or jump straight into a specific category or budget range. Every
            product listing includes key specs, pricing, and payment options so you can make a confident
            choice before you checkout.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
            <Link href="/categories" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
              Browse categories
            </Link>
            <Link href="/budget-search" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
              Shop by budget
            </Link>
            <Link href="/match-score" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
              Find your perfect match
            </Link>
          </div>
        </section>
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







