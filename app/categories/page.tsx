import { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
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
  redirect('/products');

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
          items: [],
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
    </div>
  );
}







