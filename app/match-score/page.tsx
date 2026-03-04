import { Metadata } from 'next';
import { Suspense } from 'react';
import { MatchScorePage } from '@/components/MatchScorePage';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Find Your Perfect Match',
  description: 'Use our match score calculator to find products that match your criteria',
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
        <MatchScorePage />
      </main>
      <Footer />
    </div>
  );
}







