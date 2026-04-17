export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { CartPage } from '@/components/CartPage';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';

export default function Cart() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Wrap header (which uses useSearchParams) in Suspense for CSR bailout */}
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
        <CartPage />
      </main>
      <Footer />
    </div>
  );
}







