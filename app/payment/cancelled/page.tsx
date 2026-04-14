import { Suspense } from 'react';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { PaymentCancelledClient } from './cancelled-client';

export const dynamic = 'force-dynamic';

export default function PaymentCancelledPage() {
  return (
    <div className="app-page">
      <Suspense
        fallback={
          <HeaderWithAnnouncement />
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>

      <Suspense
        fallback={
          <main className="app-page__main app-centered-shell">
            <div className="payment-result-card u-animate-pulse">
              <div className="u-skeleton-circle u-skeleton-circle--16 u-mx-auto u-mb-4" />
              <div className="u-skeleton-line u-skeleton-line--h8 u-skeleton-line--w-48 u-mx-auto u-mb-4" />
              <div className="u-skeleton-line u-skeleton-line--h4 u-skeleton-line--w-64 u-mx-auto" />
            </div>
          </main>
        }
      >
        <PaymentCancelledClient />
      </Suspense>

      <Footer />
    </div>
  );
}









