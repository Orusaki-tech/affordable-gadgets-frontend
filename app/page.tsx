import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { HomeHero } from '@/components/HomeHero';
import { SpecialOffersServer } from '@/components/SpecialOffersServer';
import {
  ProductGridClient,
  HomeProductVideosClient,
  ReviewsShowcaseClient,
  CategoriesSectionClient,
  RecentlyViewedClient,
} from '@/components/HomeSectionsClient';
import { ImageCarousel } from '@/components/ImageCarousel';
import { CategoryDiscoverySection } from '@/components/CategoryDiscoverySection';
import { CollectionHeaderBanner } from '@/components/CollectionHeaderBanner';
import { BrandCarousel } from '@/components/BrandCarousel';
import { brandConfig } from '@/lib/config/brand';
import type { PaginatedPublicPromotionList, PublicPromotion } from '@/lib/api/generated';
import { Suspense } from 'react';
import { StructuredData } from '@/components/StructuredData';
import type { Metadata } from 'next';
import Link from 'next/link';

const HOME_PAGE_REVALIDATE_SECONDS = 60;
const HERO_PROMOTIONS_PAGE_SIZE = 50;
const FEATURED_SCHEMA_PAGE_SIZE = 8;

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

const resolveProductImage = (image?: string | null) => {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  return `${brandConfig.apiBaseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
};

async function fetchFeaturedProductsForSchema(): Promise<
  Array<{ product_name: string; slug?: string | null; primary_image?: string | null }>
> {
  const searchParams = new URLSearchParams({
    featured: '1',
    page: '1',
    page_size: String(FEATURED_SCHEMA_PAGE_SIZE),
  });

  try {
    const response = await fetch(
      `${brandConfig.apiBaseUrl}/api/v1/public/products/?${searchParams.toString()}`,
      {
        next: { revalidate: HOME_PAGE_REVALIDATE_SECONDS },
        headers: {
          'X-Brand-Code': brandConfig.code,
        },
      }
    );
    if (!response.ok) return [];
    const data = (await response.json()) as { results?: unknown };
    const results = Array.isArray((data as any)?.results) ? ((data as any).results as any[]) : [];
    return results
      .map((p) => ({
        product_name: String(p?.product_name ?? ''),
        slug: typeof p?.slug === "string" ? p.slug : null,
        primary_image: typeof p?.primary_image === "string" ? p.primary_image : null,
      }))
      .filter((p) => Boolean(p.product_name));
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: { absolute: 'Affordable Gadgets Ke | Premium Affordable Smartphones, Laptops and iPads in Kenya' },
  description:
    'Apple iPhone, Samsung, Google Pixel, Sony, OnePlus & more — premium smartphones, laptops and accessories in Kenya. Shop ex-UK deals at Kimathi House 4th Floor Suite 409. Call 0717881573.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Affordable Gadgets Ke | Premium Affordable Smartphones, Laptops and iPads in Kenya',
    description:
      'Apple iPhone, Samsung, Google Pixel, Sony, OnePlus & more — premium smartphones, laptops and accessories in Kenya. Shop ex-UK deals at Kimathi House 4th Floor Suite 409. Call 0717881573.',
    url: '/',
    images: [
      {
        url: '/affordable-social-share.png',
        width: 1200,
        height: 630,
        alt: 'Affordable Gadgets Kenya',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Affordable Gadgets Ke | Premium Affordable Smartphones, Laptops and iPads in Kenya',
    description:
      'Apple iPhone, Samsung, Google Pixel, Sony, OnePlus & more — premium smartphones, laptops and accessories in Kenya. Shop ex-UK deals at Kimathi House 4th Floor Suite 409. Call 0717881573.',
    images: ['/affordable-social-share.png'],
  },
};

export default async function HomePage() {
  const initialHeroPromotionsData = await fetchInitialHeroPromotions();
  const featuredForSchema = await fetchFeaturedProductsForSchema();
  type FeaturedItem = { name: string; url: string; image?: string | null; type: 'Thing' };
  const isFeaturedItem = (value: FeaturedItem | null): value is FeaturedItem => value !== null;

  const featuredItemListItems: FeaturedItem[] = featuredForSchema
    .map((p): FeaturedItem | null => {
      const slug = p.slug?.trim();
      if (!slug) return null;
      return {
        name: p.product_name,
        url: `${brandConfig.siteUrl}/products/${slug}`,
        image: resolveProductImage(p.primary_image),
        // Use Thing for ItemList entries so Google doesn't require Product offers/reviews here.
        // The actual Product rich result is emitted on the product detail page.
        type: 'Thing',
      };
    })
    .filter(isFeaturedItem);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {featuredItemListItems.length > 0 && (
        <StructuredData
          type="ItemList"
          itemList={{
            name: `${brandConfig.name} featured products`,
            url: brandConfig.siteUrl,
            items: featuredItemListItems,
          }}
        />
      )}
      <StructuredData
        type="BreadcrumbList"
        breadcrumbs={[{ name: 'Home', url: brandConfig.siteUrl }]}
      />
      <StructuredData
        type="FAQPage"
        faqs={[
          {
            question: 'Do you deliver phones and laptops across Kenya?',
            answer:
              'Yes. We deliver in Nairobi and ship across Kenya. Delivery timelines and fees vary by location and are shown at checkout or on the shipping page.',
          },
          {
            question: 'Can I pay with M‑Pesa?',
            answer:
              'Yes. We accept M‑Pesa and other payment options shown during checkout.',
          },
          {
            question: 'Do your devices come with a warranty?',
            answer:
              'Most devices come with a warranty period as indicated on the product page and during checkout.',
          },
          {
            question: 'Where are you located in Nairobi?',
            answer:
              'We are located at Kimathi House, Nairobi CBD. You can also order online for delivery.',
          },
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
      <main className="flex-1">
        <h1 className="sr-only">
          Affordable phones, laptops, tablets and accessories in Kenya
        </h1>
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

        {/* Product / testimonial videos (template for future product-specific reels) */}
        <HomeProductVideosClient />

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

        {/* Category discovery — Apple Store layout & imagery */}
        <section id="category-discovery" className="bg-white scroll-mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="text-left mb-6 lg:mb-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                <span className="bg-gradient-to-r from-gray-800 via-gray-900 to-black bg-clip-text text-transparent">
                  Discover
                </span>
              </h2>
              <p className="text-gray-600 text-lg sm:text-xl mb-2">What&apos;s new in our lineup</p>
            </div>
            <CategoryDiscoverySection />
          </div>
        </section>

        {/* Browse collection carousel */}
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

        {/* SEO intro section – placed near footer */}
        <section className="bg-white/80 border-t border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
            <div className="max-w-4xl">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
                Affordable gadgets in Kenya for every budget
              </h2>
              <p className="mt-3 text-base leading-7 text-gray-700 sm:text-lg">
                Discover curated deals on smartphones, laptops, tablets, iPads, and accessories at Affordable
                Gadgets Ke. Compare prices, explore payment options, and shop confident that every device is
                sourced and tested for Kenyan customers.
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base">
                Start with today&apos;s promotions above, or jump straight to{' '}
                <Link
                  href="/products"
                  className="font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
                >
                  all products
                </Link>{' '}
                or{' '}
                <Link
                  href="/budget-search"
                  className="font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
                >
                  shop by budget
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
