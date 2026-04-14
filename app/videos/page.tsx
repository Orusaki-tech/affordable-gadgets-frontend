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
            <h1 className="page-heading-3xl">Product Videos</h1>
            <p className="page-lead">
              Browse product demos and video previews to get a closer look at devices before you buy. This
              page surfaces phones, laptops, tablets, and accessories with supporting video content so you
              can see condition, colour, and key features in real-world lighting.
            </p>
            <p className="page-lead--compact">
              Use these short clips to compare models, understand size and design, and hear how each device
              performs in everyday Kenyan use cases like mobile money, social media, work, and school.
            </p>
            <div className="page-pill-links">
              <Link href="/products" className="page-pill-link">
                Browse products
              </Link>
              <Link href="/reviews" className="page-pill-link">
                Read reviews
              </Link>
            </div>
          </div>
        </section>
        {/* Stories Carousel */}
        <section className="page-container u-py-6">
          <StoriesCarousel autoAdvanceDuration={5} />
        </section>

        {/* Product Videos Section */}
        <section className="page-container u-py-8">
          <Suspense fallback={
            <div className="u-animate-pulse">
              <div className="u-skeleton-line u-skeleton-line--h8 u-skeleton-line--w-48 u-mb-4" />
              <div className="u-grid-3-responsive u-gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="u-skeleton-line u-skeleton-line--h64 u-w-full u-rounded-lg" />
                ))}
              </div>
            </div>
          }>
            <ProductVideosSection />
          </Suspense>
        </section>

        {/* Special Offers */}
        <section className="page-container u-py-8">
          <SpecialOffers pageSize={12} />
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

