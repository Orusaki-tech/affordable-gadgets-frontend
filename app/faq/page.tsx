import { Suspense } from 'react';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function FaqPage() {
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
        <h1 className="simple-page-heading">FAQs</h1>
        <div className="simple-page-faq-list">
          <div>
            <h2>Do you offer warranties?</h2>
            <p>Yes. Warranty terms depend on the product and are shared at purchase.</p>
          </div>
          <div>
            <h2>Can I reserve a device?</h2>
            <p>Yes. Contact us to reserve units and confirm availability.</p>
          </div>
          <div>
            <h2>Do you deliver outside Nairobi?</h2>
            <p>Yes. We deliver countrywide with varying timelines and fees.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
