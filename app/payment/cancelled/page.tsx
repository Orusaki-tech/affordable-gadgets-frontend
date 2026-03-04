import { Suspense } from 'react';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { PaymentCancelledClient } from './cancelled-client';

export const dynamic = 'force-dynamic';

export default function PaymentCancelledPage() {
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

      <Suspense
        fallback={
          <main className="flex-1 flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
              <div className="animate-pulse">
                <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
              </div>
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









