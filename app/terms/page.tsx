import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return (
    <div className="app-page app-page--bg-white">
      <Suspense
        fallback={
          <HeaderWithAnnouncement />
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>
      <main className="app-page__main page-container u-py-12">
        <h1 className="simple-page-heading">Terms of Service</h1>
        <div className="simple-page-prose">
          <p>
            By using our website, placing an order, or interacting with Affordable Gadgets Ke on any channel,
            you agree to these terms and conditions. Please read them carefully before completing a purchase.
          </p>
          <p>
            Our terms explain how pricing, availability, payments, warranties, returns, and delivery work for
            phones, laptops, tablets, and accessories purchased through this site. We may occasionally update
            these terms to reflect changes in our services or Kenyan regulations.
          </p>
          <p>
            For questions or clarification about any section of these terms, please contact our support team
            using the details on our <a href="/contact" className="simple-page-inline-link">Contact page</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
