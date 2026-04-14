import { Suspense } from 'react';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function ContactPage() {
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
        <h1 className="simple-page-heading">Contact Us</h1>
        <p className="u-text-gray-700 u-mb-4">Reach us for product inquiries, availability, or support.</p>
        <div className="simple-page-contact-block">
          <p>
            <span className="u-font-semibold">Phone:</span> +254717881573
          </p>
          <p>
            <span className="u-font-semibold">Email:</span> affordablegadgetske@gmail.com
          </p>
          <p>
            <span className="u-font-semibold">Location:</span> Kimathi House Room 409, Nairobi
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
