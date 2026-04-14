'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { OpenAPI, OrdersService, PesapalService } from '@/lib/api/generated';
import { inventoryBaseUrl } from '@/lib/api/openapi';
import Link from 'next/link';
import { ORDER_STATUS } from '@/lib/constants/apiEnums';

const SUCCESS_PAYMENT_STATES = new Set(['PAID', 'DELIVERED', 'COMPLETED', 'SUCCESS', 'SUCCEEDED']);
const FAILED_PAYMENT_STATES = new Set(['CANCELED', 'CANCELLED', 'FAILED', 'INVALID']);

export function PaymentCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState<string>('Processing payment...');
  const hasStartedRef = useRef(false);
  const orderTrackingId = searchParams.get('OrderTrackingId');
  const orderMerchantReference = searchParams.get('OrderMerchantReference');

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    console.log('\n[PESAPAL] ========== CALLBACK PAGE: PROCESSING CALLBACK ==========');
    console.log('[PESAPAL] Order Tracking ID:', orderTrackingId);
    console.log('[PESAPAL] Order Merchant Reference:', orderMerchantReference);
    console.log('[PESAPAL] All URL Params:', Object.fromEntries(searchParams.entries()));

    const orderId = orderMerchantReference || searchParams.get('order_id');

    console.log('[PESAPAL] Extracted Order ID:', orderId);

    if (!orderId) {
      console.log('[PESAPAL] ERROR: Order ID not found in callback');
      setStatus('failed');
      setMessage('Order ID not found in callback');
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;
    const maxAttempts = 20; // 20 * 3s ~= 1 minute
    let attempts = 0;

    const checkStatus = async () => {
      const previousBase = OpenAPI.BASE;
      try {
        attempts += 1;
        console.log('[PESAPAL] Checking payment status for order:', orderId);
        OpenAPI.BASE = inventoryBaseUrl;
        const paymentStatus = await OrdersService.ordersPaymentStatusRetrieve(orderId);
        console.log('[PESAPAL] Payment Status:', JSON.stringify(paymentStatus, null, 2));
        const normalizedStatus = String(paymentStatus.status || '').toUpperCase();
        const normalizedOrderStatus = String((paymentStatus as any).order_status || '').toUpperCase();
        const isSuccess =
          SUCCESS_PAYMENT_STATES.has(normalizedStatus) ||
          SUCCESS_PAYMENT_STATES.has(normalizedOrderStatus) ||
          paymentStatus.status === ORDER_STATUS.PAID ||
          paymentStatus.status === ORDER_STATUS.DELIVERED;
        const isFailure =
          FAILED_PAYMENT_STATES.has(normalizedStatus) ||
          FAILED_PAYMENT_STATES.has(normalizedOrderStatus) ||
          paymentStatus.status === ORDER_STATUS.CANCELED;

        if (isSuccess) {
          if (!isMounted) return;
          console.log('[PESAPAL] Payment is COMPLETED - showing success');
          setStatus('success');
          setMessage('Payment completed successfully!');

          setTimeout(() => {
            console.log('[PESAPAL] Redirecting to payment success page for GCR opt-in...');
            const params = new URLSearchParams({ order_id: orderId });
            if (orderTrackingId) {
              params.set('payment_reference', orderTrackingId);
            }
            router.push(`/payment/success?${params.toString()}`);
          }, 2000);
        } else if (isFailure) {
          if (!isMounted) return;
          console.log('[PESAPAL] Payment is', paymentStatus.status, '- showing failure');
          setStatus('failed');
          setMessage('Payment failed or was cancelled.');
        } else if (attempts >= maxAttempts) {
          if (!isMounted) return;
          console.log('[PESAPAL] Max callback polling attempts reached');
          setStatus('failed');
          setMessage('Payment verification timed out. Please check your order status in Orders.');
        } else {
          console.log('[PESAPAL] Payment status:', paymentStatus.status, '- will poll again in 3 seconds');
          if (!isMounted) return;
          setMessage('Payment is being processed...');
          timeoutId = setTimeout(checkStatus, 3000);
        }
      } catch (error: any) {
        if (!isMounted) return;
        console.log('[PESAPAL] ========== CALLBACK PAGE: ERROR CHECKING STATUS ==========');
        console.log('[PESAPAL] Error checking payment status:', error);
        console.log('[PESAPAL] ===========================================================\n');
        setStatus('failed');
        setMessage('Unable to verify payment status. Please check your order status.');
      } finally {
        OpenAPI.BASE = previousBase;
      }
    };

    const processCallback = async () => {
      // Forward Pesapal callback params to backend so order status can be reconciled.
      if (orderTrackingId || orderMerchantReference) {
        const previousBase = OpenAPI.BASE;
        try {
          OpenAPI.BASE = inventoryBaseUrl;
          await PesapalService.pesapalIpnRetrieve(
            orderMerchantReference || undefined,
            searchParams.get('OrderNotificationType') || undefined,
            orderTrackingId || undefined,
            searchParams.get('PaymentAccount') || undefined,
            searchParams.get('PaymentMethod') || undefined,
            searchParams.get('PaymentStatusDescription') || undefined
          );
        } catch (ipnErr) {
          // Continue to polling even if IPN forwarding fails.
          console.warn('[PESAPAL] Failed to forward callback params to backend IPN endpoint', ipnErr);
        } finally {
          OpenAPI.BASE = previousBase;
        }
      }

      await checkStatus();
    };

    processCallback();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchParams, orderMerchantReference, router, orderTrackingId]);

  return (
    <main className="app-page__main app-centered-shell">
      <div className="payment-result-card">
        {status === 'loading' && (
          <>
            <div className="payment-status-icon-well payment-status-icon-well--muted">
              <svg
                className="payment-status-icon payment-status-icon--primary payment-status-icon--spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="u-opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="u-opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <h2 className="payment-result-title">Processing Payment</h2>
            <p className="payment-result-body">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="payment-status-icon-well payment-status-icon-well--success">
              <svg className="payment-status-icon payment-status-icon--success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="payment-result-title payment-result-title--success">Payment Successful!</h2>
            <p className="payment-result-body payment-result-body--spaced">{message}</p>
            <p className="payment-result-meta payment-result-meta--mb-4">Redirecting...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="payment-status-icon-well payment-status-icon-well--error">
              <svg className="payment-status-icon payment-status-icon--error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="payment-result-title payment-result-title--error">Payment Failed</h2>
            <p className="payment-result-body payment-result-body--spaced">{message}</p>
            <div className="u-space-y-2">
              <Link href="/cart" className="u-btn u-btn--primary">
                Back to Cart
              </Link>
              <Link href="/products" className="u-btn u-btn--neutral">
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

