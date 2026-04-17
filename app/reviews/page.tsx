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
          <div className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Customer Reviews</h1>
            <p className="mt-3 text-base leading-7 text-gray-600 sm:text-lg">
              Read recent feedback from customers who purchased from Affordable Gadgets Ke. These reviews
              highlight product quality, condition, delivery experience, and real-life usage for popular devices.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
              <Link href="/products" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
                Shop products
              </Link>
              <Link href="/videos" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
                Watch product videos
              </Link>
            </div>
          </div>
        </section>
        {/* Stories Carousel */}
        <section className="container mx-auto px-4 py-6">
          <StoriesCarousel autoAdvanceDuration={5} />
        </section>

        {/* Reviews Showcase */}
        <section className="container mx-auto px-4 py-8">
          <ReviewsShowcase />
        </section>

        {/* Special Offers */}
        <section className="container mx-auto px-4 py-8">
          <SpecialOffers pageSize={12} />
        </section>

        {/* Featured Products */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold mb-6">Featured Products</h2>
          <ProductGrid pageSize={8} showPagination={false} />
        </section>
      </main>

      <Footer />
    </div>
  );
}







