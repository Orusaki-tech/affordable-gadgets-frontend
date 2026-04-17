import { Suspense } from 'react';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { ReviewEligibilityPanel } from '@/components/ReviewEligibilityPanel';

export const dynamic = 'force-dynamic';

export default function ReviewEligibilityPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Suspense
        fallback={
          <div className="site-header-wrapper">
            <HeaderWithAnnouncement />
          </div>
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>
      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <div className="mx-auto max-w-3xl mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
              Check if your purchase is eligible for a review
            </h1>
            <p className="mt-3 text-base leading-7 text-gray-600 sm:text-lg">
              Enter the phone number you used at checkout or sign in to your account to see which phones,
              laptops, tablets, and accessories you can review on Affordable Gadgets Ke.
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base">
              Verified reviews help other shoppers in Kenya choose the right device and improve our service.
            </p>
          </div>
          <ReviewEligibilityPanel />
        </section>
      </main>
      <Footer />
    </div>
  );
}
