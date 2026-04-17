import Link from 'next/link';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { CategoriesPage } from '@/components/CategoriesPage';
import { StructuredData } from '@/components/StructuredData';
import { brandConfig } from '@/lib/config/brand';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Shop by Category',
  description: 'Browse phones, laptops, tablets, iPads, and accessories by category at Affordable Gadgets Ke.',
  alternates: {
    canonical: '/categories',
  },
};

export default function Categories() {
  const categoryItems = [
    { name: 'Phones', url: `${brandConfig.siteUrl}/products?type=PH` },
    { name: 'Laptops', url: `${brandConfig.siteUrl}/products?type=LT` },
    { name: 'Tablets & iPads', url: `${brandConfig.siteUrl}/products?type=TB` },
    { name: 'Accessories', url: `${brandConfig.siteUrl}/products?type=AC` },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData type="LocalBusiness" />
      <StructuredData
        type="BreadcrumbList"
        breadcrumbs={[
          { name: 'Home', url: brandConfig.siteUrl },
          { name: 'Categories', url: `${brandConfig.siteUrl}/categories` },
        ]}
      />
      <StructuredData
        type="ItemList"
        itemList={{
          name: `${brandConfig.name} categories`,
          url: `${brandConfig.siteUrl}/categories`,
          items: categoryItems.map((item) => ({
            ...item,
            type: 'CollectionPage',
          })),
        }}
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
      <main className="flex-1 container mx-auto px-4 py-8">
        <section className="mx-auto mb-8 max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            Explore categories
          </p>
          <p className="mt-3 text-base leading-7 text-gray-600 sm:text-lg">
            Browse our collection by product type to quickly find smartphones, laptops, tablets, iPads,
            and everyday accessories. Each category links directly to relevant products so shoppers and
            search engines can discover the right section faster.
          </p>
          <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base">
            Use the quick links below to jump into the category that matches how you shop&mdash;whether
            you are upgrading your main phone, looking for a work laptop, or adding affordable accessories
            like earphones, chargers, and cases.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
            <Link href="/products?type=PH" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
              Phones
            </Link>
            <Link href="/products?type=LT" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
              Laptops
            </Link>
            <Link href="/products?type=TB" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
              Tablets & iPads
            </Link>
            <Link href="/products?type=AC" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
              Accessories
            </Link>
          </div>
        </section>
        <CategoriesPage />
      </main>
      <Footer />
    </div>
  );
}







