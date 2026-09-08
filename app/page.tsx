import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { HomeHeroSpotlight } from '@/components/home/HomeHeroSpotlight';
import { HomeCbdRibbon } from '@/components/home/HomeCbdRibbon';
import { HomeFeaturedHardware } from '@/components/home/HomeFeaturedHardware';
import { HomeBudgetMatcher } from '@/components/home/HomeBudgetMatcher';
import { HomeBundles } from '@/components/home/HomeBundles';
import { HomeBnplCalculator } from '@/components/home/HomeBnplCalculator';
import { HomeVideoReels } from '@/components/home/HomeVideoReels';
import { HomeBuyingGuides } from '@/components/home/HomeBuyingGuides';
import { HomeReviews } from '@/components/home/HomeReviews';
import { HomeDeliveryChecker } from '@/components/home/HomeDeliveryChecker';
import { brandConfig } from '@/lib/config/brand';
import { productUrl } from '@/lib/seo/urls';
import { Suspense } from 'react';
import { StructuredData } from '@/components/StructuredData';
import type { Metadata } from 'next';

const HOME_PAGE_REVALIDATE_SECONDS = 60;
const FEATURED_SCHEMA_PAGE_SIZE = 8;

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

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data?.results) ? data.results : [];
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: {
    absolute: `${brandConfig.name} | Affordable phones, laptops & accessories in Kenya`,
  },
  description:
    'Shop verified brand-new and refurbished phones, laptops, and accessories in Nairobi. Warranty, M-Pesa, BNPL, and countrywide delivery.',
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  const featuredProducts = await fetchFeaturedProductsForSchema();
  const featuredItemListItems = featuredProducts
    .filter((p) => p.slug)
    .map((p) => ({
      name: p.product_name,
      url: productUrl(p.slug!),
      image: resolveProductImage(p.primary_image) || undefined,
    }));

  return (
    <div className="home-redesign__page flex min-h-screen flex-col">
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
            answer: 'Yes. We accept M‑Pesa and other payment options shown during checkout.',
          },
          {
            question: 'Do your devices come with a warranty?',
            answer:
              'Most devices come with a warranty period as indicated on the product page and during checkout.',
          },
          {
            question: 'Where are you located in Nairobi?',
            answer:
              'Visit our CBD shop at Norwich Union House, Kimathi Street (also Kimathi House Room 504). You can also order online for delivery.',
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

      <main className="home-redesign__main">
        <h1 className="sr-only">
          Affordable phones, laptops, tablets and accessories in Kenya
        </h1>

        <HomeHeroSpotlight />
        <HomeCbdRibbon />
        <HomeFeaturedHardware />
        <HomeBudgetMatcher />
        <HomeBundles />
        <HomeBnplCalculator />
        <HomeVideoReels />
        <Suspense fallback={<div className="min-h-[200px]" aria-hidden />}>
          <HomeBuyingGuides />
        </Suspense>
        <HomeReviews />
        <HomeDeliveryChecker />
      </main>

      <Footer />
    </div>
  );
}
