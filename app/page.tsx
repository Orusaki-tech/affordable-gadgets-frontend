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
        slug: typeof p?.slug === 'string' ? p.slug : null,
        primary_image: typeof p?.primary_image === 'string' ? p.primary_image : null,
      }))
      .filter((p) => Boolean(p.product_name));
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: { absolute: 'Affordable Gadgets Ke | Premium Affordable Smartphones, Laptops and iPads in Kenya' },
  description:
    'Your dream phone is waiting Upgrade with us. Best Deals on Ex-UK | Phones|Buy Latest Iphones,Samsung,Sony,Google Pixel,OnePlus at crazy good prices Kimathi House 4th Floor Suite 409. Call us on 0717881573.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Affordable Gadgets Ke | Premium Affordable Smartphones, Laptops and iPads in Kenya',
    description:
      'Your dream phone is waiting Upgrade with us. Best Deals on Ex-UK | Phones|Buy Latest Iphones,Samsung,Sony,Google Pixel,OnePlus at crazy good prices Kimathi House 4th Floor Suite 409. Call us on 0717881573.',
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
      'Your dream phone is waiting Upgrade with us. Best Deals on Ex-UK | Phones|Buy Latest Iphones,Samsung,Sony,Google Pixel,OnePlus at crazy good prices Kimathi House 4th Floor Suite 409. Call us on 0717881573.',
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
        type: 'Thing',
      };
    })
    .filter(isFeaturedItem);

  return (
    <div className="home-shell">
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
          <HeaderWithAnnouncement />
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>
      <main className="app-page__main">
        <h1 className="sr-only">
          Affordable phones, laptops, tablets and accessories in Kenya
        </h1>
        <HomeHero initialPromotionsData={initialHeroPromotionsData} />

        <section id="promotions" className="home-section home-section--surface-default u-scroll-mt-20">
          <div className="home-section__inner home-section__inner--promotions">
            <div className="home-section__intro">
              <h2 className="home-heading">
                <span className="home-heading-gradient home-heading-gradient--fire">Promotions</span>
              </h2>
              <p className="home-subheading">Don&apos;t miss out on these amazing deals</p>
            </div>
            <SpecialOffersServer pageSize={12} />
          </div>
        </section>

        <div className="home-section home-section--surface-default">
          <div className="home-section__inner home-section__inner--banner">
            <CollectionHeaderBanner
              src="https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773132870/banner208_l3akqy.png"
              alt="Featured products"
            />
          </div>
        </div>

        <section id="featured-products" className="home-section home-section--gradient-fade u-scroll-mt-20">
          <div className="home-section__inner home-section__inner--featured">
            <div className="home-section__intro home-section__intro--tight">
              <h2 className="home-heading">
                <span className="home-heading-gradient home-heading-gradient--primary">Featured Products</span>
              </h2>
              <p className="home-subheading">Handpicked for you</p>
            </div>
            <ProductGridClient featuredOnly pageSize={5} showPagination={false} cardOptions={{ variant: 'featured' }} />
          </div>
        </section>

        <HomeProductVideosClient />

        <section id="reviews" className="home-section home-section--surface-default u-scroll-mt-20">
          <div className="home-section__inner home-section__inner--reviews">
            <div className="home-section__intro">
              <h2 className="home-heading">
                <span className="home-heading-gradient home-heading-gradient--warm">What Our Customers Say</span>
              </h2>
              <p className="home-subheading">Real reviews from real customers</p>
            </div>
            <ReviewsShowcaseClient />
          </div>
        </section>

        <section id="brands" className="home-section home-section--brands u-scroll-mt-20">
          <div className="home-section__inner home-section__inner--brands">
            <BrandCarousel />
          </div>
        </section>

        <section id="categories" className="home-section home-section--gradient-fade-2 u-scroll-mt-20">
          <div className="home-section__inner home-section__inner--categories">
            <div className="home-section__intro">
              <h2 className="home-heading">
                <span className="home-heading-gradient home-heading-gradient--primary">Shop by Category</span>
              </h2>
              <p className="home-subheading">Find exactly what you&apos;re looking for</p>
            </div>
            <CategoriesSectionClient />
          </div>
        </section>

        <section id="image-carousel" className="home-section home-section--gradient-fade u-scroll-mt-20">
          <div className="home-section__inner home-section__inner--carousel">
            <div className="home-section__intro home-section__intro--carousel">
              <h2 className="home-heading">
                <span className="home-heading-gradient home-heading-gradient--cool">Browse</span>
              </h2>
              <p className="home-subheading">Explore our collection</p>
            </div>
            <ImageCarousel />
          </div>
        </section>

        <section id="recently-viewed" className="home-section home-section--surface-default u-scroll-mt-20">
          <div className="home-section__inner home-section__inner--recent">
            <div className="home-section__intro">
              <h2 className="home-heading">
                <span className="home-heading-gradient home-heading-gradient--purple">Recently Viewed</span>
              </h2>
              <p className="home-subheading">Continue browsing where you left off</p>
            </div>
            <RecentlyViewedClient />
          </div>
        </section>

        <section className="home-section home-section--seo">
          <div className="home-section__inner home-section__inner--seo">
            <div className="home-seo-block">
              <h2 className="home-seo-title">Affordable gadgets in Kenya for every budget</h2>
              <p className="home-seo-body">
                Discover curated deals on smartphones, laptops, tablets, iPads, and accessories at Affordable
                Gadgets Ke. Compare prices, explore payment options, and shop confident that every device is
                sourced and tested for Kenyan customers.
              </p>
              <p className="home-seo-note">
                Start with today&apos;s promotions above, or jump straight to{' '}
                <Link href="/products" className="u-link-brand">
                  all products
                </Link>{' '}
                or{' '}
                <Link href="/budget-search" className="u-link-brand">
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
