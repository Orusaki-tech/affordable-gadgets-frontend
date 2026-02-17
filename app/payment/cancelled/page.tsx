'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

function PaymentCancelledContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <main className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <svg
                className="h-8 w-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-yellow-600">Payment Cancelled</h2>
            <p className="text-gray-600 mb-4">
              Your payment was cancelled. No charges were made to your account.
            </p>
            {orderId && (
              <p className="text-sm text-gray-500 mb-4">
                Order ID: <span className="font-mono font-semibold">{orderId}</span>
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Link
              href="/cart"
              className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Return to Cart
            </Link>
            <Link
              href="/products"
              className="block w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
  );
}

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderWithAnnouncement />
      <Suspense fallback={
        <main className="flex-1 flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
            <div className="animate-pulse">
              <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
            </div>
          </div>
        </main>
      }>
        <PaymentCancelledContent />
      </Suspense>
      <Footer />
    </div>
  );
}









