export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { CartPage } from '@/components/CartPage';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';

export default function Cart() {
  return (
    <div className="app-page">
      {/* Wrap header (which uses useSearchParams) in Suspense for CSR bailout */}
      <Suspense
        fallback={
          <HeaderWithAnnouncement />
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>

      <main className="app-page__main page-container u-py-8">
        <CartPage />
      </main>
      <Footer />
    </div>
  );
}







