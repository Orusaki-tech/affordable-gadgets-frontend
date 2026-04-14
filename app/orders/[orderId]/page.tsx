'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { OpenAPI, OrdersService, Order } from '@/lib/api/generated';
import { inventoryBaseUrl } from '@/lib/api/openapi';
import { formatPrice } from '@/lib/utils/format';
import Link from 'next/link';

function OrderDetailContent() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const previousBase = OpenAPI.BASE;
        OpenAPI.BASE = inventoryBaseUrl;
        const orderData = await OrdersService.ordersRetrieve(orderId);
        OpenAPI.BASE = previousBase;
        setOrder(orderData);
        setError(null);
        const status = (orderData.status || '').toLowerCase();
        if (status === 'delivered' || status === 'canceled') {
          setPolling(false);
        }
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }

    if (orderId && polling) {
      interval = setInterval(fetchOrder, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [orderId, polling]);

  const downloadReceipt = async () => {
    if (!orderId) return;
    setDownloadingReceipt(true);
    setError(null);
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
    } catch (err: any) {
      setError(err?.message || 'Unable to download receipt right now.');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  if (loading) {
    return (
      <main className="app-page__main app-centered-shell">
        <div className="app-centered-card">
          <div className="u-animate-pulse">
            <div className="u-skeleton-line u-skeleton-line--h8 u-skeleton-line--w-half u-mb-4" />
            <div className="u-skeleton-line u-skeleton-line--h4 u-skeleton-line--w-3-4 u-mb-8" />
            <div className="u-space-y-4">
              <div className="u-skeleton-line u-skeleton-line--h20 u-w-full u-rounded-lg" />
              <div className="u-skeleton-line u-skeleton-line--h20 u-w-full u-rounded-lg" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-page__main app-centered-shell">
        <div className="app-centered-card u-text-center">
          <div className="u-mb-6">
            <div className="order-error-icon-wrap">
              <svg className="u-icon-8 u-text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="u-text-2xl u-font-bold u-mb-2 u-text-error">Error Loading Order</h2>
            <p className="u-text-gray-600 u-mb-4">{error}</p>
            {error.includes('authentication') || error.includes('permission') ? (
              <p className="u-text-sm u-text-gray-500 u-mb-4">
                You may need to log in to view this order, or the order may not exist.
              </p>
            ) : null}
          </div>
          <div className="u-space-y-2">
            <Link href="/products" className="u-btn u-btn--primary">
              Continue Shopping
            </Link>
            <Link href="/payment/success" className="u-btn u-btn--neutral">
              Back to Payment Success
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  const getStatusClass = (status?: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'paid':
        return 'order-status-pill order-status-pill--paid';
      case 'pending':
        return 'order-status-pill order-status-pill--pending';
      case 'delivered':
        return 'order-status-pill order-status-pill--delivered';
      case 'canceled':
        return 'order-status-pill order-status-pill--canceled';
      default:
        return 'order-status-pill order-status-pill--default';
    }
  };

  const getItemProductName = (item: (typeof order.order_items)[number]) => {
    const inventoryUnit = (item as { inventory_unit?: { product_name?: string } }).inventory_unit;
    if (inventoryUnit?.product_name) {
      return inventoryUnit.product_name;
    }

    const fallbackName = (item as { inventory_unit_name?: string }).inventory_unit_name;
    return fallbackName || 'Product';
  };

  return (
    <main className="app-page__main u-bg-surface-default u-py-8">
      <div className="page-container page-container--medium">
        <div className="order-detail-card">
          {/* Header */}
          <div className="u-mb-8">
            <h1 className="u-text-3xl u-font-bold u-mb-2 u-text-title">Order Details</h1>
            <p className="u-text-gray-600">
              Order ID: <span className="u-font-mono u-font-semibold">{order.order_id}</span>
            </p>
          </div>

          {/* Order Status */}
          {(() => {
            const createdAt = order.created_at ?? '';
            return (
              <>
          <div className="u-mb-6">
            <div className="u-flex u-items-center u-gap-2">
              <span className="u-text-sm u-font-medium u-text-gray-700">Status:</span>
              <span className={getStatusClass(order.status)}>{order.status ?? 'Unknown'}</span>
            </div>
            <p className="u-text-sm u-text-gray-500 u-mt-2">
              Ordered on:{' '}
              {createdAt
                ? new Date(createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'N/A'}
            </p>
          </div>
              </>
            );
          })()}

          {/* Order Items */}
          <div className="u-mb-8">
            <h2 className="u-text-xl u-font-semibold u-mb-4 u-text-title">Order Items</h2>
            <div className="u-space-y-4">
              {order.order_items && order.order_items.length > 0 ? (
                order.order_items.map((item) => (
                  <div key={item.id} className="order-item-row">
                    <div>
                      <h3 className="u-font-semibold u-text-lg u-text-title">{getItemProductName(item)}</h3>
                      <p className="u-text-sm u-text-gray-600">
                        Quantity: {item.quantity ?? 0} × {formatPrice(Number(item.unit_price_at_purchase ?? 0))}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p className="u-font-semibold u-text-lg u-text-title">
                        {formatPrice(Number(item.unit_price_at_purchase ?? 0) * Number(item.quantity ?? 0))}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="u-text-gray-500">No items found in this order.</p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="u-border-t u-pt-6 u-mb-8">
            <div className="order-summary-row">
              <span className="u-text-lg u-font-semibold u-text-title">Total Amount:</span>
              <span className="u-text-2xl u-font-bold u-text-primary-900">
                {formatPrice(Number(order.total_amount ?? 0))}
              </span>
            </div>
            <div className="order-summary-row">
              <span className="u-text-sm u-text-gray-600">Delivery Fee:</span>
              <span className="u-text-sm u-font-semibold u-text-title">
                {formatPrice(Number((order as any).delivery_fee ?? 0))}
              </span>
            </div>
            {order.customer_username && (
              <p className="u-text-sm u-text-gray-600">Customer: {order.customer_username}</p>
            )}
            {(order as any).delivery_address && (
              <p className="u-text-sm u-text-gray-600 u-mt-2">Delivery Address: {(order as any).delivery_address}</p>
            )}
            {((order as any).delivery_county || (order as any).delivery_ward) && (
              <p className="u-text-sm u-text-gray-600">
                Location: {(order as any).delivery_county || 'N/A'}
                {(order as any).delivery_ward ? `, ${(order as any).delivery_ward}` : ''}
              </p>
            )}
            {((order as any).delivery_window_start || (order as any).delivery_window_end) && (
              <p className="u-text-sm u-text-gray-600">
                Delivery Window:{' '}
                {(order as any).delivery_window_start
                  ? new Date((order as any).delivery_window_start).toLocaleString()
                  : 'N/A'}{' '}
                -{' '}
                {(order as any).delivery_window_end
                  ? new Date((order as any).delivery_window_end).toLocaleString()
                  : 'N/A'}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="order-detail-actions">
            <button
              onClick={downloadReceipt}
              disabled={downloadingReceipt}
              type="button"
              className="u-btn u-btn--primary u-flex u-items-center u-justify-center u-gap-2"
            >
              <svg className="home-product-videos__icon-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {downloadingReceipt ? 'Downloading Receipt...' : 'Download Receipt'}
            </button>
            <Link href="/products" className="u-btn u-btn--neutral u-text-center">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function OrderDetailPage() {
  return (
    <div className="app-page">
      <Suspense
        fallback={
          <HeaderWithAnnouncement />
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>
      <Suspense
        fallback={
          <main className="app-page__main app-centered-shell">
            <div className="app-centered-card">
              <div className="u-animate-pulse">
                <div className="u-skeleton-line u-skeleton-line--h8 u-skeleton-line--w-half u-mb-4" />
                <div className="u-skeleton-line u-skeleton-line--h4 u-skeleton-line--w-3-4 u-mb-8" />
              </div>
            </div>
          </main>
        }
      >
        <OrderDetailContent />
      </Suspense>
      <Footer />
    </div>
  );
}

