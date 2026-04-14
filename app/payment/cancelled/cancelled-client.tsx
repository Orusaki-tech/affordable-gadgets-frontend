'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export function PaymentCancelledClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <main className="app-page__main app-centered-shell">
      <div className="payment-result-card">
        <div className="payment-result-section">
          <div className="payment-status-icon-well payment-status-icon-well--caution">
            <svg className="payment-status-icon payment-status-icon--caution" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="payment-result-title payment-result-title--caution">Payment Cancelled</h2>
          <p className="payment-result-body payment-result-body--spaced">
            Your payment was cancelled. No charges were made to your account.
          </p>
          {orderId && (
            <p className="payment-result-meta payment-result-meta--mb-4">
              Order ID: <span className="u-font-mono u-font-semibold">{orderId}</span>
            </p>
          )}
        </div>
        <div className="u-space-y-2">
          <Link href="/cart" className="u-btn u-btn--primary">
            Return to Cart
          </Link>
          <Link href="/products" className="u-btn u-btn--neutral">
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

