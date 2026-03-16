import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Suspense
        fallback={
          <div className="site-header-wrapper">
            <HeaderWithAnnouncement />
          </div>
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-gray-700 mb-3">
          By using our website, placing an order, or interacting with Affordable Gadgets Ke on any channel,
          you agree to these terms and conditions. Please read them carefully before completing a purchase.
        </p>
        <p className="text-gray-700 mb-3">
          Our terms explain how pricing, availability, payments, warranties, returns, and delivery work for
          phones, laptops, tablets, and accessories purchased through this site. We may occasionally update
          these terms to reflect changes in our services or Kenyan regulations.
        </p>
        <p className="text-gray-700">
          For questions or clarification about any section of these terms, please contact our support team
          using the details on our <a href="/contact" className="underline text-[var(--primary)]">Contact page</a>.
        </p>
      </main>
      <Footer />
    </div>
  );
}
