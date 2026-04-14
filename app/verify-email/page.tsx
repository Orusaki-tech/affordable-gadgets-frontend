import { Suspense } from 'react';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { VerifyEmailClient } from './verify-email-client';

export const dynamic = 'force-dynamic';

export default function VerifyEmailPage() {
  return (
    <div className="app-page">
      <Suspense
        fallback={
          <HeaderWithAnnouncement />
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>
      <main className="app-page__main page-container u-py-16">
        <Suspense
          fallback={
            <div className="verify-email-card">
              <h1 className="verify-email-card__title">Email Verification</h1>
              <p className="verify-email-card__message">Verifying your email...</p>
            </div>
          }
        >
          <VerifyEmailClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
