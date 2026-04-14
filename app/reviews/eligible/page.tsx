import { Suspense } from 'react';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { ReviewEligibilityPanel } from '@/components/ReviewEligibilityPanel';

export const dynamic = 'force-dynamic';

export default function ReviewEligibilityPage() {
  return (
    <div className="app-page">
      <Suspense
        fallback={
          <HeaderWithAnnouncement />
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>
      <main className="app-page__main">
        <section className="page-container u-py-10">
          <div className="page-card-elevated page-card-elevated--3xl">
            <h1 className="page-heading-2xl">Check if your purchase is eligible for a review</h1>
            <p className="page-lead">
              Enter the phone number you used at checkout or sign in to your account to see which phones,
              laptops, tablets, and accessories you can review on Affordable Gadgets Ke.
            </p>
            <p className="page-lead--compact">
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
