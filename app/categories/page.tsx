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
    <div className="app-page">
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
          <HeaderWithAnnouncement />
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>
      <main className="app-page__main page-container u-py-8">
        <section className="page-intro-block page-intro-block--4xl">
          <p className="page-intro-block__kicker">Explore categories</p>
          <p className="page-intro-block__copy page-intro-block__copy--after-kicker">
            Browse our collection by product type to quickly find smartphones, laptops, tablets, iPads,
            and everyday accessories. Each category links directly to relevant products so shoppers and
            search engines can discover the right section faster.
          </p>
          <p className="page-intro-block__copy--small">
            Use the quick links below to jump into the category that matches how you shop&mdash;whether
            you are upgrading your main phone, looking for a work laptop, or adding affordable accessories
            like earphones, chargers, and cases.
          </p>
          <div className="page-pill-links">
            <Link href="/products?type=PH" className="page-pill-link">
              Phones
            </Link>
            <Link href="/products?type=LT" className="page-pill-link">
              Laptops
            </Link>
            <Link href="/products?type=TB" className="page-pill-link">
              Tablets & iPads
            </Link>
            <Link href="/products?type=AC" className="page-pill-link">
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







