import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VerifyEmailClient } from './verify-email-client';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16">
        <Suspense
          fallback={
            <div className="max-w-lg mx-auto bg-white rounded-2xl shadow p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
              <p className="mb-6 text-gray-700">Verifying your email...</p>
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
