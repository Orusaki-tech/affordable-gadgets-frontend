import { Metadata } from 'next';
import { Suspense } from 'react';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { CategoriesPage } from '@/components/CategoriesPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse products by category - Phones, Laptops, Tablets/Ipads, and Accessories',
};

export default function Categories() {
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
      <main className="flex-1 container mx-auto px-4 py-8">
        <CategoriesPage />
      </main>
      <Footer />
    </div>
  );
}







