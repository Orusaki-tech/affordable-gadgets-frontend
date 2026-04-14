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
    <div className="app-page">
      <Suspense
        fallback={
          <HeaderWithAnnouncement />
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>

      <main className="app-page__main page-container u-py-8">
        <section className="u-mb-8">
          <div className="page-card-elevated page-card-elevated--4xl page-card-elevated--no-mb">
            <p className="page-lead page-lead--first">
              Use the match score tool to discover products that fit your budget and preferred specs. Choose
              your ideal price range, storage, RAM, and condition to surface the best-fitting devices faster.
            </p>
            <div className="page-pill-links">
              <Link href="/budget-search" className="page-pill-link">
                Shop by budget
              </Link>
              <Link href="/products" className="page-pill-link">
                Browse all products
              </Link>
            </div>
          </div>
        </section>
        <MatchScorePage />
      </main>
      <Footer />
    </div>
  );
}







