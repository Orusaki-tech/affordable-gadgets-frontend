'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');

  return (
    <main className="app-page__main page-container u-py-16">
      <div className="checkout-success-shell">
        <div className="checkout-success-hero">
          <div className="checkout-success-icon-well">
            <svg className="checkout-success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="section-label u-mb-4">Thank You!</h1>
          <p className="checkout-success-subline">Your inquiry has been submitted successfully.</p>
          {reference && <p className="checkout-success-reference">Reference: {reference}</p>}
        </div>

        <div className="checkout-success-info">
          <p>
            A salesperson will contact you shortly to assist with your inquiry. You can track your
            inquiry using the reference number above.
          </p>
        </div>

        <div className="checkout-success-actions">
          <Link href="/products" className="u-btn u-btn--primary-lg">
            Continue Shopping
          </Link>
          {reference && (
            <Link href={`/leads/${reference}`} className="u-btn u-btn--outline">
              Track Inquiry
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

