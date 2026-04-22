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
      <main className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
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
            <h2 className="text-2xl font-bold mb-2 text-red-600">Error Loading Order</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            {error.includes('authentication') || error.includes('permission') ? (
              <p className="text-sm text-gray-500 mb-4">
                You may need to log in to view this order, or the order may not exist.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Link
              href="/products"
              className="block w-full bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] font-semibold"
            >
              Continue Shopping
            </Link>
            <Link
              href="/payment/success"
              className="block w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-semibold"
            >
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

  const itemsTotal = (order.order_items || []).reduce((sum, item) => {
    const unitPrice = Number(item.unit_price_at_purchase ?? 0);
    const qty = Number(item.quantity ?? 0);
    return sum + unitPrice * qty;
  }, 0);
  const deliveryFee = Number((order as any).delivery_fee ?? 0);
  const grandTotal = itemsTotal + deliveryFee;
  const isItemsPaid = Boolean((order as any).is_items_paid);
  const isDeliveryPaid = Boolean((order as any).is_delivery_paid);
  const remainingItems = isItemsPaid ? 0 : itemsTotal;
  const remainingDelivery = isDeliveryPaid ? 0 : deliveryFee;
  const remainingTotal = remainingItems + remainingDelivery;

  const getStatusColor = (status?: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-gray-100 text-[var(--primary-dark)]';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <main className="flex-1 bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Order Details</h1>
            <p className="text-gray-600">
              Order ID: <span className="font-mono font-semibold">{order.order_id}</span>
            </p>
          </div>

          {/* Order Status */}
          {(() => {
            const createdAt = order.created_at ?? '';
            return (
              <>
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                {order.status ?? 'Unknown'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
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
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.order_items && order.order_items.length > 0 ? (
                order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-semibold text-lg">
                        {getItemProductName(item)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity ?? 0} × {formatPrice(Number(item.unit_price_at_purchase ?? 0))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {formatPrice(Number(item.unit_price_at_purchase ?? 0) * Number(item.quantity ?? 0))}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No items found in this order.</p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-6 mb-8">
            <div className="mb-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold mb-3">Payment breakdown</h3>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Items total</span>
                  <span className="text-sm font-semibold">{formatPrice(itemsTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shipping fee</span>
                  <span className="text-sm font-semibold">{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-semibold">Grand total</span>
                  <span className="text-sm font-bold text-[var(--primary)]">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-md bg-white border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Items paid</span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        isItemsPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {isItemsPaid ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-600">Remaining</span>
                    <span className="font-semibold">{formatPrice(remainingItems)}</span>
                  </div>
                </div>

                <div className="p-3 rounded-md bg-white border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Shipping paid</span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        isDeliveryPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {isDeliveryPaid ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-600">Remaining</span>
                    <span className="font-semibold">{formatPrice(remainingDelivery)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm font-semibold">Remaining balance</span>
                <span className="text-lg font-bold">{formatPrice(remainingTotal)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold">Order total:</span>
              <span className="text-2xl font-bold text-[var(--primary)]">
                {formatPrice(Number(order.total_amount ?? 0))}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Shipping Fee:</span>
              <span className="text-sm font-semibold">
                {formatPrice(deliveryFee)}
              </span>
            </div>
            {order.customer_username && (
              <p className="text-sm text-gray-600">
                Customer: {order.customer_username}
              </p>
            )}
            {(order as any).delivery_address && (
              <p className="text-sm text-gray-600 mt-2">
                Shipping Address: {(order as any).delivery_address}
              </p>
            )}
            {((order as any).delivery_county || (order as any).delivery_ward) && (
              <p className="text-sm text-gray-600">
                Location: {(order as any).delivery_county || 'N/A'}{(order as any).delivery_ward ? `, ${(order as any).delivery_ward}` : ''}
              </p>
            )}
            {((order as any).delivery_window_start || (order as any).delivery_window_end) && (
              <p className="text-sm text-gray-600">
                Shipping Window: {(order as any).delivery_window_start ? new Date((order as any).delivery_window_start).toLocaleString() : 'N/A'}{" "}
                - {(order as any).delivery_window_end ? new Date((order as any).delivery_window_end).toLocaleString() : 'N/A'}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={downloadReceipt}
              disabled={downloadingReceipt}
              className="flex-1 bg-[var(--primary)] text-white px-6 py-3 rounded-lg hover:bg-[var(--primary-dark)] font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {downloadingReceipt ? 'Downloading Receipt...' : 'Download Receipt'}
            </button>
            <Link
              href="/products"
              className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 font-semibold text-center"
            >
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
    <div className="min-h-screen flex flex-col">
      <Suspense
        fallback={
          <div className="site-header-wrapper">
            <HeaderWithAnnouncement />
          </div>
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>
      <Suspense fallback={
        <main className="flex-1 flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
            </div>
          </div>
        </main>
      }>
        <OrderDetailContent />
      </Suspense>
      <Footer />
    </div>
  );
}

