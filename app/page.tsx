import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { HeroPromotions } from '@/components/HeroPromotions';
import { SpecialOffersServer } from '@/components/SpecialOffersServer';
import {
  ProductGridClient,
  ReviewsShowcaseClient,
  CategoriesSectionClient,
  RecentlyViewedClient,
} from '@/components/HomeSectionsClient';
import { CollectionHeaderBanner } from '@/components/CollectionHeaderBanner';
import { BrandCarousel } from '@/components/BrandCarousel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <HeaderWithAnnouncement />
      
      <main className="flex-1">
        {/* Promotions */}
        <section id="promotions" className="bg-white scroll-mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-[30px] pb-12 sm:pb-12 lg:pb-16">
            <div className="mb-10 lg:mb-12">
              <HeroPromotions />
            </div>
            <div className=" mb-10 lg:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                <span className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  Promotions
                </span>
              </h2>
              <p className="text-gray-600 text-lg sm:text-xl">Don't miss out on these amazing deals</p>

            </div>
            <SpecialOffersServer pageSize={12} />
          </div>
        </section>

        {/* Collection header banner – static image above Featured Products. Add image at public/images/banners/featured-banner.jpg and set src to show it. */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-5">
          <CollectionHeaderBanner alt="Featured products" />
        </div>

        {/* Featured Products */}
        <section id="featured-products" className="bg-gradient-to-b from-gray-50 to-white scroll-mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
            <div className="text-left mb-5 lg:mb-5">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                <span className="bg-gradient-to-r from-[var(--primary)] via-[var(--primary-light)] to-[var(--primary-dark)] bg-clip-text text-transparent">
                  Featured Products
                </span>
              </h2>
              <p className="text-gray-600 text-lg sm:text-xl mb-2">Handpicked for you</p>
            </div>
            <ProductGridClient pageSize={8} showPagination={false} cardOptions={{ variant: 'featured' }} />
          </div>
        </section>

        {/* Reviews Showcase */}
        <section id="reviews" className="bg-white scroll-mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="text-left mb-12 lg:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  What Our Customers Say
                </span>
              </h2>
              <p className="text-gray-600 text-lg sm:text-xl mb-2">Real reviews from real customers</p>
            </div>
            <ReviewsShowcaseClient />
          </div>
        </section>

        {/* Brand carousel – above Shop by Category (50×100px rectangles) */}
        <section id="brands" className="bg-white scroll-mt-20" style={{ minHeight: '120px' }}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <BrandCarousel />
          </div>
        </section>

        {/* Categories */}
        <section id="categories" className="bg-gradient-to-b from-white via-gray-50 to-white scroll-mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="text-left mb-12 lg:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 ">
                <span className="bg-gradient-to-r from-[var(--primary)] via-[var(--primary-light)] to-[var(--primary-dark)] bg-clip-text text-transparent">
                  Shop by Category
                </span>
              </h2>
              <p className="text-gray-600 text-lg sm:text-xl mb-2">Find exactly what you're looking for</p>
            </div>
            <CategoriesSectionClient />
          </div>
        </section>

        {/* Recently Viewed */}
        <section id="recently-viewed" className="bg-white scroll-mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="text-left mb-12 lg:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 ">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                  Recently Viewed
                </span>
              </h2>
              <p className="text-gray-600 text-lg sm:text-xl mb-2">Continue browsing where you left off</p>
            </div>
            <RecentlyViewedClient />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
