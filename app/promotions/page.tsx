import Link from 'next/link';
import { Metadata } from 'next';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { StoriesCarousel } from '@/components/StoriesCarousel';
import { ProductGrid } from '@/components/ProductGrid';
import { SpecialOffersServer } from '@/components/SpecialOffersServer';
import { ReviewsShowcase } from '@/components/ReviewsShowcase';
import { Suspense } from 'react';

type PromotionsPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Promotions',
  description: 'Discover current special offers, flash sales, and featured deals on phones, laptops, tablets, and accessories.',
  alternates: {
    canonical: '/promotions',
  },
};

export default async function PromotionsPage({ searchParams }: PromotionsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filterParam = resolvedSearchParams?.filter;
  const filter: 'special_offers' | 'flash_sales' | undefined =
    filterParam === 'special_offers' || filterParam === 'flash_sales'
      ? filterParam
      : undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <Suspense
        fallback={
          <div className="site-header-wrapper">
            <HeaderWithAnnouncement />
          </div>
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>
      <main className="flex-1">
        <section className="container mx-auto px-4 pt-8">
          <div className="mx-auto max-w-5xl rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Latest Promotions</h1>
            <p className="mt-3 text-base leading-7 text-gray-600 sm:text-lg">
              Explore featured deals, seasonal discounts, flash sales, and limited-time offers across our
              electronics catalog. This page helps shoppers discover current promotions and jump straight
              to discounted products.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
              <Link href="/products" className="rounded-full bg-white px-4 py-2 text-gray-700 shadow-sm">
                View all products
              </Link>
              <Link href="/reviews" className="rounded-full bg-white px-4 py-2 text-gray-700 shadow-sm">
                Read customer reviews
              </Link>
            </div>
          </div>
        </section>
        {/* Stories Carousel */}
        <section className="container mx-auto px-4 py-6">
          <StoriesCarousel autoAdvanceDuration={5} />
        </section>

        {/* Special Offers / Flash Sales (filtered if filter param exists) */}
        <section className="container mx-auto px-4 py-8">
          <SpecialOffersServer filter={filter} pageSize={100} />
        </section>

        {/* Featured Products */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold mb-6">Featured Products</h2>
          <ProductGrid pageSize={8} showPagination={false} />
        </section>

        {/* Reviews Showcase */}
        <section className="container mx-auto px-4 py-8">
          <ReviewsShowcase />
        </section>
      </main>
      <Footer />
    </div>
  );
}







