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
    <div className="app-page">
      <Suspense
        fallback={
          <HeaderWithAnnouncement />
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>
      <main className="app-page__main">
        <section className="page-container u-pt-8">
          <div className="page-card-promotions">
            <h1 className="page-heading-3xl">Latest Promotions</h1>
            <p className="page-lead">
              Explore featured deals, seasonal discounts, flash sales, and limited-time offers across our
              electronics catalog. This page helps shoppers discover current promotions and jump straight
              to discounted products.
            </p>
            <div className="page-pill-links">
              <Link href="/products" className="page-pill-link page-pill-link--raised">
                View all products
              </Link>
              <Link href="/reviews" className="page-pill-link page-pill-link--raised">
                Read customer reviews
              </Link>
            </div>
          </div>
        </section>
        {/* Stories Carousel */}
        <section className="page-container u-py-6">
          <StoriesCarousel autoAdvanceDuration={5} />
        </section>

        {/* Special Offers / Flash Sales (filtered if filter param exists) */}
        <section className="page-container u-py-8">
          <SpecialOffersServer filter={filter} pageSize={100} />
        </section>

        {/* Featured Products */}
        <section className="page-container u-py-8">
          <h2 className="page-section-heading">Featured Products</h2>
          <ProductGrid pageSize={8} showPagination={false} />
        </section>

        {/* Reviews Showcase */}
        <section className="page-container u-py-8">
          <ReviewsShowcase />
        </section>
      </main>
      <Footer />
    </div>
  );
}







