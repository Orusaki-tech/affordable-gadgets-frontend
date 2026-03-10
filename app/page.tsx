import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { HomeHero } from '@/components/HomeHero';
import { SpecialOffersServer } from '@/components/SpecialOffersServer';
import {
  ProductGridClient,
  ReviewsShowcaseClient,
  CategoriesSectionClient,
  RecentlyViewedClient,
} from '@/components/HomeSectionsClient';
import { ImageCarousel } from '@/components/ImageCarousel';
import { CollectionHeaderBanner } from '@/components/CollectionHeaderBanner';
import { BrandCarousel } from '@/components/BrandCarousel';
import { brandConfig } from '@/lib/config/brand';
import type { PaginatedPublicPromotionList, PublicPromotion } from '@/lib/api/generated';
import { Suspense } from 'react';

const HOME_PAGE_REVALIDATE_SECONDS = 60;
const HERO_PROMOTIONS_PAGE_SIZE = 50;

function normalizeLocations(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function sortPromotions(promotions: PublicPromotion[]) {
  return [...promotions].sort((a, b) => {
    const aPos = a.carousel_position;
    const bPos = b.carousel_position;
    const aHasPos = typeof aPos === 'number';
    const bHasPos = typeof bPos === 'number';

    if (aHasPos && bHasPos) return aPos - bPos;
    if (aHasPos) return -1;
    if (bHasPos) return 1;

    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });
}

function selectHomeHeroPromotions(promotions: PublicPromotion[]) {
  const featuredForHero = promotions.filter((promo) => {
    const locations = normalizeLocations((promo as { display_locations?: unknown }).display_locations);
    return locations.length > 0 && locations.includes('homepage_hero');
  });

  const baseList = featuredForHero.length > 0 ? featuredForHero : promotions;
  return sortPromotions(baseList);
}

async function fetchInitialHeroPromotions(): Promise<PaginatedPublicPromotionList | undefined> {
  const searchParams = new URLSearchParams({
    page_size: String(HERO_PROMOTIONS_PAGE_SIZE),
  });

  try {
    const response = await fetch(
      `${brandConfig.apiBaseUrl}/api/v1/public/promotions/?${searchParams.toString()}`,
      {
        next: { revalidate: HOME_PAGE_REVALIDATE_SECONDS },
        headers: {
          'X-Brand-Code': brandConfig.code,
        },
      }
    );

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as PaginatedPublicPromotionList;
    return {
      ...data,
      results: selectHomeHeroPromotions(
        Array.isArray(data?.results) ? (data.results as PublicPromotion[]) : []
      ),
    };
  } catch {
    return undefined;
  }
}

export const revalidate = 60;

export default async function HomePage() {
  const initialHeroPromotionsData = await fetchInitialHeroPromotions();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-50">
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
        <HomeHero initialPromotionsData={initialHeroPromotionsData} />

        {/* Promotions */}
        <section id="promotions" className="bg-white scroll-mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-[30px] pb-12 sm:pb-12 lg:pb-16">
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

        {/* Collection header banner – static image above Featured Products. */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-5">
          <CollectionHeaderBanner
            src="https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773132870/banner208_l3akqy.png"
            alt="Featured products"
          />
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
            <ProductGridClient featuredOnly pageSize={5} showPagination={false} cardOptions={{ variant: 'featured' }} />
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

        {/* Brand carousel – above Shop by Category (120×70px, last item followed by first) */}
        <section id="brands" className="scroll-mt-20" style={{ minHeight: '140px', backgroundColor: '#f5f5f7' }}>
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

        {/* Image carousel – placeholder cards, not clickable */}
        <section id="image-carousel" className="bg-gradient-to-b from-gray-50 to-white scroll-mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="text-left mb-6 lg:mb-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 ">
                <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Browse
                </span>
              </h2>
              <p className="text-gray-600 text-lg sm:text-xl mb-2">Explore our collection</p>
            </div>
            <ImageCarousel />
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
