import Link from 'next/link';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { MatchScorePage } from '@/components/MatchScorePage';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Find Your Perfect Match',
  description: 'Use our match score tool to compare products by budget, storage, RAM, condition, and availability.',
  alternates: {
    canonical: '/match-score',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function MatchScore() {
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
        <section className="mx-auto mb-8 max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-base leading-7 text-gray-600 sm:text-lg">
            Use the match score tool to discover products that fit your budget and preferred specs. Choose
            your ideal price range, storage, RAM, and condition to surface the best-fitting devices faster.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
            <Link href="/budget-search" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
              Shop by budget
            </Link>
            <Link href="/products" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
              Browse all products
            </Link>
          </div>
        </section>
        <MatchScorePage />
      </main>
      <Footer />
    </div>
  );
}







