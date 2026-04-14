import { Suspense } from 'react';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { FinancingProductsPage } from '@/components/FinancingProductsPage';

export const revalidate = 3600;

export default function FinancingPage() {
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
        <Suspense
          fallback={
            <div className="financing-page-skeleton-grid u-animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="financing-page-skeleton-card" />
              ))}
            </div>
          }
        >
          <FinancingProductsPage />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

