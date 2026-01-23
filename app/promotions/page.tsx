'use client';

import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StoriesCarousel } from '@/components/StoriesCarousel';
import { ProductGrid } from '@/components/ProductGrid';
import { SpecialOffers } from '@/components/SpecialOffers';
import { ReviewsShowcase } from '@/components/ReviewsShowcase';
import { useSearchParams } from 'next/navigation';

function PromotionsContent() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  
  // Type guard: ensure filter is one of the valid values
  const filter: 'special_offers' | 'flash_sales' | undefined = 
    filterParam === 'special_offers' || filterParam === 'flash_sales' 
      ? filterParam 
      : undefined;

  return (
    <main className="flex-1">
      {/* Stories Carousel */}
      <section className="container mx-auto px-4 py-6">
        <StoriesCarousel autoAdvanceDuration={5} />
      </section>

      {/* Special Offers / Flash Sales (filtered if filter param exists) */}
      <section className="container mx-auto px-4 py-8">
        <SpecialOffers filter={filter} pageSize={100} />
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Featured Products</h2>
        <ProductGrid pageSize={8} showPagination={false} />
      </section>

      {/* Reviews Showcase */}
      <section className="container mx-auto px-4 py-8">
        <ReviewsShowcase />
      </section>
    </main>
  );
}

export default function PromotionsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Suspense fallback={
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-8">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </main>
      }>
        <PromotionsContent />
      </Suspense>
      <Footer />
    </div>
  );
}







