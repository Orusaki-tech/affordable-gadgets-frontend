import { Suspense } from 'react';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
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
        <h1 className="simple-page-heading">Privacy Policy</h1>
        <div className="simple-page-prose">
          <p>We value your privacy and only collect data needed to process orders and improve your experience.</p>
          <p>We do not sell your personal information to third parties.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
