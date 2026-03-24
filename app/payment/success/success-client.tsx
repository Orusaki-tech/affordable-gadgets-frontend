'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { brandConfig } from '@/lib/config/brand';
import { OpenAPI, OrdersService, type Order } from '@/lib/api/generated';
import { inventoryBaseUrl } from '@/lib/api/openapi';
import { GoogleCustomerReviewsOptIn } from '@/components/GoogleCustomerReviewsOptIn';

export function PaymentSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const paymentReference = searchParams.get('payment_reference');
  const [order, setOrder] = useState<Order | null>(null);
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<string | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [orderFetchFailed, setOrderFetchFailed] = useState(false);
  const [gcrAlreadyShown, setGcrAlreadyShown] = useState(false);

  const downloadReceipt = async () => {
    if (!orderId) return;
    setDownloadingReceipt(true);
    try {
      const response = await fetch(
        `${inventoryBaseUrl}/orders/${orderId}/receipt/?format=pdf`,
        { method: 'GET', credentials: 'include' }
      );
      if (!response.ok) {
        throw new Error(`Failed to download receipt (${response.status})`);
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `receipt-${orderId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Receipt download failed', err);
    } finally {
      setDownloadingReceipt(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchOrder = async (id: string) => {
      const previousBase = OpenAPI.BASE;
      try {
        OpenAPI.BASE = inventoryBaseUrl;
        const data = await OrdersService.ordersRetrieve(id);
        if (mounted) {
          setOrder(data);
          setOrderFetchFailed(false);
        }
      } catch (error) {
        console.warn('[GCR] Failed to fetch order for opt-in payload', { orderId: id, error });
        // If order isn't accessible yet, we still show success UI; opt-in will simply not render.
        if (mounted) {
          setOrder(null);
          setOrderFetchFailed(true);
        }
      } finally {
        OpenAPI.BASE = previousBase;
      }
    };

    if (orderId) fetchOrder(orderId);
    return () => {
      mounted = false;
    };
  }, [orderId]);

  useEffect(() => {
    if (!orderId || typeof window === 'undefined') {
      setGcrAlreadyShown(false);
      return;
    }
    const key = `gcr-optin-shown:${orderId}`;
    setGcrAlreadyShown(window.sessionStorage.getItem(key) === '1');
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      setEstimatedDeliveryDate(null);
      return;
    }
    const deliveryEnd = (order as any)?.delivery_window_end as string | undefined;
    const deliveryStart = (order as any)?.delivery_window_start as string | undefined;
    const base = deliveryEnd || deliveryStart;

    const parsed = base ? new Date(base) : null;
    const estimated = parsed && !Number.isNaN(parsed.valueOf()) ? parsed : null;
    if (!estimated) {
      setEstimatedDeliveryDate(null);
      return;
    }
    const d = estimated;
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setEstimatedDeliveryDate(`${yyyy}-${mm}-${dd}`);
  }, [orderId, order]);

  const gcrPayload = useMemo(() => {
    if (!orderId) return null;
    const email = (order?.customer_email || '').trim();
    if (!email) return null;
    if (!estimatedDeliveryDate) return null;

    return {
      merchantId: 5748422735,
      orderId,
      email,
      deliveryCountry: 'KE',
      estimatedDeliveryDate,
    };
  }, [orderId, order, estimatedDeliveryDate]);

  const shouldRenderGcrOptIn = !!gcrPayload && !gcrAlreadyShown;

  useEffect(() => {
    if (!shouldRenderGcrOptIn || !orderId || typeof window === 'undefined') return;
    const key = `gcr-optin-shown:${orderId}`;
    window.sessionStorage.setItem(key, '1');
    setGcrAlreadyShown(true);
  }, [shouldRenderGcrOptIn, orderId]);

  return (
    <main className="flex-1 flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
        {shouldRenderGcrOptIn ? (
          <GoogleCustomerReviewsOptIn
            merchantId={gcrPayload.merchantId}
            orderId={gcrPayload.orderId}
            email={gcrPayload.email}
            deliveryCountry={gcrPayload.deliveryCountry}
            estimatedDeliveryDate={gcrPayload.estimatedDeliveryDate}
          />
        ) : null}
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <Image
              src="/affordablelogo.png"
              alt={`${brandConfig.name} logo`}
              width={100}
              height={100}
              className="object-contain h-16 w-auto"
              priority
            />
          </div>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-8 w-8 text-green-600"
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
          <h2 className="text-2xl font-bold mb-2 text-green-600">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your payment has been confirmed. Your order is being processed and you will receive a confirmation shortly.
          </p>
          {orderId && (
            <p className="text-sm text-gray-500 mb-2">
              Order ID: <span className="font-mono font-semibold">{orderId}</span>
            </p>
          )}
          {paymentReference && (
            <p className="text-sm text-gray-500 mb-4">
              Payment Reference: <span className="font-mono font-semibold">{paymentReference}</span>
            </p>
          )}
          {orderFetchFailed && (
            <p className="text-xs text-amber-700 mb-4">
              We could not load full order details yet. Your confirmation is still valid.
            </p>
          )}
        </div>
        <div className="space-y-2">
          {orderId && (
            <button
              onClick={downloadReceipt}
              disabled={downloadingReceipt}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {downloadingReceipt ? 'Downloading Receipt...' : 'Download Receipt'}
            </button>
          )}
          <Link
            href="/products"
            className="block w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-semibold"
          >
            Continue Shopping
          </Link>
          {orderId && (
            <Link
              href={`/orders/${orderId}`}
              className="block w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-semibold"
            >
              View Order
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

