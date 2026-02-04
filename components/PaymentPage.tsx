'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePayment } from '@/lib/hooks/usePayment';
import { formatPrice } from '@/lib/utils/format';
import Link from 'next/link';
import { brandConfig } from '@/lib/config/brand';
import { OrderStatusEnum } from '@/lib/api/generated';

interface PaymentPageProps {
  orderId: string;
  totalAmount: number;
  callbackUrl?: string;
}

export function PaymentPage({ orderId, totalAmount, callbackUrl }: PaymentPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);

  const {
    paymentStatus,
    isLoading,
    error,
    isPolling,
    initiatePayment,
    checkPaymentStatus,
    startPolling, // ✅ NEW: Use startPolling method
  } = usePayment({
    orderId,
    autoStartPolling: false, // ✅ FIXED: Don't auto-start polling
    onPaymentComplete: () => {
      // Redirect to success page
      const successUrl = callbackUrl || `/payment/success?order_id=${orderId}`;
      router.push(successUrl);
    },
    onPaymentFailed: (errorMsg) => {
      console.error('Payment failed:', errorMsg);
      // Show error but don't redirect automatically
    },
  });

  // Initialize payment on mount (only if not returning from Pesapal)
  useEffect(() => {
    const orderTrackingId = searchParams.get('OrderTrackingId');
    
    // ✅ FIXED: If user is returning from Pesapal, don't initiate payment again
    if (orderTrackingId) {
      console.log('[PESAPAL] User returned from Pesapal - OrderTrackingId:', orderTrackingId);
      console.log('[PESAPAL] Skipping payment initiation - will check status instead');
      return;
    }

    const initPayment = async () => {
      console.log('\n[PESAPAL] ========== COMPONENT: INITIALIZE PAYMENT START ==========');
      console.log('[PESAPAL] Order ID:', orderId);
      
      // Get callback URL from search params or use default
      const callback = searchParams.get('callback_url') || callbackUrl || `${window.location.origin}/payment/callback`;
      const cancellationUrl = searchParams.get('cancellation_url') || `${window.location.origin}/payment/cancelled`;

      console.log('[PESAPAL] Callback URL:', callback);
      console.log('[PESAPAL] Cancellation URL:', cancellationUrl);

      const result = await initiatePayment({
        callback_url: callback,
        cancellation_url: cancellationUrl,
      });

      console.log('[PESAPAL] Initiate payment result:', JSON.stringify(result, null, 2));

      if (result?.redirect_url) {
        console.log('[PESAPAL] Setting redirect URL:', result.redirect_url);
        setRedirectUrl(result.redirect_url);
      } else {
        console.log('[PESAPAL] No redirect URL in result');
      }
      
      console.log('[PESAPAL] ========== COMPONENT: INITIALIZE PAYMENT END ==========\n');
    };

    if (orderId && !redirectUrl && !paymentStatus) {
      console.log('[PESAPAL] Conditions met - initializing payment');
      initPayment();
    } else {
      console.log('[PESAPAL] Skipping payment initialization:', {
        hasOrderId: !!orderId,
        hasRedirectUrl: !!redirectUrl,
        hasPaymentStatus: !!paymentStatus,
      });
    }
  }, [orderId, callbackUrl, searchParams, redirectUrl, paymentStatus, initiatePayment]);

  // ✅ FIXED: Redirect immediately (or with minimal delay) to Pesapal
  useEffect(() => {
    if (redirectUrl && !hasRedirected) {
      setHasRedirected(true);
      console.log('[PESAPAL] Redirecting to Pesapal payment page...');
      // ✅ FIXED: Remove 1-second delay - redirect immediately
      // Small delay (100ms) only to ensure state is set
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 100);
    }
  }, [redirectUrl, hasRedirected]);

  // ✅ FIXED: Check payment status and start polling ONLY when user returns from Pesapal
  useEffect(() => {
    const orderTrackingId = searchParams.get('OrderTrackingId');
    console.log('[PESAPAL] Checking for OrderTrackingId in URL params:', orderTrackingId);
    
    // ✅ FIXED: Only check status if user returned from Pesapal (has OrderTrackingId)
    // AND we haven't redirected yet (to avoid checking before redirect)
    if (orderTrackingId && orderId && !redirectUrl) {
      console.log('[PESAPAL] OrderTrackingId found - user returned from Pesapal');
      console.log('[PESAPAL] Order ID:', orderId);
      console.log('[PESAPAL] Order Tracking ID:', orderTrackingId);
      
      // Start polling for payment status
      console.log('[PESAPAL] Starting payment status polling...');
      startPolling();
      
      // Also do an immediate check
      checkPaymentStatus();
    } else {
      console.log('[PESAPAL] No OrderTrackingId found or conditions not met - skipping status check');
      console.log('[PESAPAL] Conditions:', {
        hasOrderTrackingId: !!orderTrackingId,
        hasOrderId: !!orderId,
        hasRedirectUrl: !!redirectUrl,
      });
    }
  }, [searchParams, orderId, checkPaymentStatus, startPolling, redirectUrl]);

  // Payment status display
  if (paymentStatus) {
    if (paymentStatus.status === OrderStatusEnum.PAID || paymentStatus.status === OrderStatusEnum.DELIVERED) {
      return (
        <div className="payment-page">
          <div className="payment-page__card">
            <div className="payment-page__section">
              <div className="payment-page__icon payment-page__icon--success">
                <svg
                  className="payment-page__icon-svg payment-page__icon-svg--success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="payment-page__title payment-page__title--success">Payment Successful!</h2>
              <p className="payment-page__text">
                Your payment has been confirmed. Your order is being processed.
              </p>
              {(paymentStatus as { payment_reference?: string }).payment_reference && (
                <p className="payment-page__meta">
                  Reference:{' '}
                  <span className="payment-page__meta-value">
                    {(paymentStatus as { payment_reference?: string }).payment_reference}
                  </span>
                </p>
              )}
            </div>
            <Link
              href="/products"
              className="payment-page__primary"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      );
    }

    if (paymentStatus.status === OrderStatusEnum.CANCELED) {
      return (
        <div className="payment-page">
          <div className="payment-page__card">
            <div className="payment-page__section">
              <div className="payment-page__logo">
                <Image 
                  src="/affordablelogo.png" 
                  alt={`${brandConfig.name} logo`}
                  width={100}
                  height={100}
                  className="payment-page__logo-image"
                  priority
                />
              </div>
              <div className="payment-page__icon payment-page__icon--error">
                <svg
                  className="payment-page__icon-svg payment-page__icon-svg--error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="payment-page__title payment-page__title--error">Payment Failed</h2>
              <p className="payment-page__text">
                {(paymentStatus as { message?: string }).message ||
                  'Your payment could not be processed. Please try again.'}
              </p>
            </div>
            <div className="payment-page__actions">
              <button
                onClick={() => window.location.reload()}
                className="payment-page__primary"
              >
                Try Again
              </button>
              <Link
                href="/cart"
                className="payment-page__secondary"
              >
                Back to Cart
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  // Loading/Redirecting state
  if (isLoading || redirectUrl) {
    return (
      <div className="payment-page">
        <div className="payment-page__card">
          <div className="payment-page__section">
            <div className="payment-page__logo">
              <Image 
                src="/affordablelogo.png" 
                alt={`${brandConfig.name} logo`}
                width={100}
                height={100}
                className="payment-page__logo-image"
                priority
              />
            </div>
            <div className="payment-page__icon payment-page__icon--neutral">
              <svg
                className="payment-page__spinner"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="payment-page__spinner-track"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="payment-page__spinner-fill"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <h2 className="payment-page__title">Redirecting to Payment</h2>
            <p className="payment-page__text">
              {redirectUrl ? 'Please wait while we redirect you to Pesapal...' : 'Initializing payment...'}
            </p>
            <div className="payment-page__meta">
              <p>Order: {orderId}</p>
              <p>Amount: {formatPrice(totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Processing payment state (when polling)
  if (isPolling && !paymentStatus) {
    return (
      <div className="payment-page">
        <div className="payment-page__card">
          <div className="payment-page__section">
            <div className="payment-page__logo">
              <Image 
                src="/affordablelogo.png" 
                alt={`${brandConfig.name} logo`}
                width={100}
                height={100}
                className="payment-page__logo-image"
                priority
              />
            </div>
            <div className="payment-page__icon payment-page__icon--neutral">
              <svg
                className="payment-page__spinner"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="payment-page__spinner-track"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="payment-page__spinner-fill"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <h2 className="payment-page__title">Processing Payment</h2>
            <p className="payment-page__text">Payment is being processed...</p>
            <div className="payment-page__meta">
              <p>Order: {orderId}</p>
              <p>Amount: {formatPrice(totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="payment-page">
        <div className="payment-page__card">
          <div className="payment-page__section">
            <div className="payment-page__logo">
              <Image 
                src="/affordablelogo.png" 
                alt={`${brandConfig.name} logo`}
                width={100}
                height={100}
                className="payment-page__logo-image"
                priority
              />
            </div>
            <div className="payment-page__icon payment-page__icon--error">
              <svg
                className="payment-page__icon-svg payment-page__icon-svg--error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="payment-page__title payment-page__title--error">Payment Error</h2>
            <p className="payment-page__text">{error}</p>
          </div>
          <div className="payment-page__actions">
            <button
              onClick={() => window.location.reload()}
              className="payment-page__primary"
            >
              Try Again
            </button>
            <Link
              href="/cart"
              className="payment-page__secondary"
            >
              Back to Cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}









