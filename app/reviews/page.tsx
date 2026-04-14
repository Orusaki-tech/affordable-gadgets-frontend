import { Suspense } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { StoriesCarousel } from '@/components/StoriesCarousel';
import { ProductGrid } from '@/components/ProductGrid';
import { SpecialOffers } from '@/components/SpecialOffers';
import { ReviewsShowcase } from '@/components/ReviewsShowcase';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Customer Reviews',
  description: 'Read verified customer reviews, ratings, photos, and feedback on phones, laptops, tablets, and accessories.',
  alternates: {
    canonical: '/reviews',
  },
};

export default function ReviewsPage() {
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
          <div className="page-card-elevated page-card-elevated--5xl">
            <h1 className="page-heading-3xl">Customer Reviews</h1>
            <p className="page-lead">
              Read recent feedback from customers who purchased from Affordable Gadgets Ke. These reviews
              highlight product quality, condition, delivery experience, and real-life usage for popular devices.
            </p>
            <div className="page-pill-links">
              <Link href="/products" className="page-pill-link">
                Shop products
              </Link>
              <Link href="/videos" className="page-pill-link">
                Watch product videos
              </Link>
            </div>
          </div>
        </section>
        {/* Stories Carousel */}
        <section className="page-container u-py-6">
          <StoriesCarousel autoAdvanceDuration={5} />
        </section>

        {/* Reviews Showcase */}
        <section className="page-container u-py-8">
          <ReviewsShowcase />
        </section>

        {/* Special Offers */}
        <section className="page-container u-py-8">
          <SpecialOffers pageSize={12} />
        </section>

        {/* Featured Products */}
        <section className="page-container u-py-8">
          <h2 className="page-section-heading">Featured Products</h2>
          <ProductGrid pageSize={8} showPagination={false} />
        </section>
      </main>

      <Footer />
    </div>
  );
}







