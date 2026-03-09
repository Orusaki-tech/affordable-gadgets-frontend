import { Suspense } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { ProductsPage } from '@/components/ProductsPage';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Products',
  description: 'Browse phones, laptops, tablets, iPads, and accessories with filters for brand, price, and category.',
  alternates: {
    canonical: '/products',
  },
};

export default function ProductsListingPage() {
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
        <section className="mx-auto mb-8 max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-base leading-7 text-gray-600 sm:text-lg">
            Explore the full Affordable Gadgets Ke catalog with search and filters for phones, laptops,
            tablets, iPads, and accessories. You can narrow results by category, brand, or price range to
            quickly compare devices that match your budget.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
            <Link href="/categories" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
              Browse categories
            </Link>
            <Link href="/budget-search" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
              Shop by budget
            </Link>
            <Link href="/match-score" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
              Find your perfect match
            </Link>
          </div>
        </section>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-96" />
              ))}
            </div>
          }
        >
          <ProductsPage />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}







