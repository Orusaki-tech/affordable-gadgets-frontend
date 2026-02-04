import { Suspense } from 'react';
import { Metadata } from 'next';
import { ProductsPage } from '@/components/ProductsPage';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Products',
  description: 'Browse our collection of phones, laptops, tablets, and accessories',
};

export default function ProductsListingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-96" />
            ))}
          </div>
        }>
          <ProductsPage />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}







