import { Suspense } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { StoriesCarousel } from '@/components/StoriesCarousel';
import { ProductVideosSection } from '@/components/ProductVideosSection';
import { SpecialOffers } from '@/components/SpecialOffers';
import { ReviewsShowcase } from '@/components/ReviewsShowcase';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Product Videos',
  description: 'Watch product videos, demos, and previews for phones, laptops, tablets, and accessories.',
  alternates: {
    canonical: '/videos',
  },
};

export default function VideosPage() {
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
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Product Videos</h1>
            <p className="mt-3 text-base leading-7 text-gray-600 sm:text-lg">
              Browse product demos and video previews to get a closer look at devices before you buy. This
              page surfaces phones, laptops, tablets, and accessories with supporting video content.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
              <Link href="/products" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
                Browse products
              </Link>
              <Link href="/reviews" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
                Read reviews
              </Link>
            </div>
          </div>
        </section>
        {/* Stories Carousel */}
        <section className="container mx-auto px-4 py-6">
          <StoriesCarousel autoAdvanceDuration={5} />
        </section>

        {/* Product Videos Section */}
        <section className="container mx-auto px-4 py-8">
          <Suspense fallback={
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded-lg" />
                ))}
              </div>
            </div>
          }>
            <ProductVideosSection />
          </Suspense>
        </section>

        {/* Special Offers */}
        <section className="container mx-auto px-4 py-8">
          <SpecialOffers pageSize={12} />
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

