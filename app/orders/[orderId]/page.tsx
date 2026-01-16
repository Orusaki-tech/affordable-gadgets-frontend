'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { orderApi, OrderResponse } from '@/lib/api/order';
import { formatPrice } from '@/lib/utils/format';
import Link from 'next/link';
import { brandConfig } from '@/lib/config/brand';

function OrderDetailContent() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderData = await orderApi.getOrder(orderId);
        setOrder(orderData);
        setError(null);
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
  }, [orderId]);

  const downloadReceipt = () => {
    if (!orderId) return;
    
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/65d9ad06-b70b-4149-bf19-de4e9e0d0599',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orders/[orderId]/page.tsx:39',message:'downloadReceipt called',data:{orderId,brandConfigApiBaseUrl:brandConfig.apiBaseUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // Get API base URL from brand config
    let apiBaseUrl = brandConfig.apiBaseUrl || 'http://localhost:8000';
    
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/65d9ad06-b70b-4149-bf19-de4e9e0d0599',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orders/[orderId]/page.tsx:43',message:'Base URL from brandConfig',data:{apiBaseUrl,hasTrailingSlash:apiBaseUrl.endsWith('/'),isEmpty:!apiBaseUrl || apiBaseUrl.trim() === '',isRelative:apiBaseUrl.startsWith('/') && !apiBaseUrl.startsWith('http')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // Fix: Handle empty, relative, or malformed base URLs
    // If base URL is empty, relative (starts with /), or doesn't start with http/https, use window.location.origin
    if (!apiBaseUrl || apiBaseUrl.trim() === '' || (apiBaseUrl.startsWith('/') && !apiBaseUrl.startsWith('http'))) {
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/65d9ad06-b70b-4149-bf19-de4e9e0d0599',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orders/[orderId]/page.tsx:48',message:'Fixing malformed base URL',data:{originalApiBaseUrl:apiBaseUrl,windowOrigin:typeof window !== 'undefined' ? window.location.origin : 'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      // Try to infer from current page origin, or use default
      if (typeof window !== 'undefined' && window.location.origin) {
        // Extract backend URL from current origin (assuming same domain or known pattern)
        // For Vercel deployments, backend is typically on a different domain
        // Fall back to a sensible default or use environment detection
        apiBaseUrl = 'http://localhost:8000'; // Will be overridden by env var in production
      }
    }
    
    // Remove trailing slash if present
    const apiBaseUrlBefore = apiBaseUrl;
    apiBaseUrl = apiBaseUrl.replace(/\/+$/, '');
    
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/65d9ad06-b70b-4149-bf19-de4e9e0d0599',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orders/[orderId]/page.tsx:58',message:'After trailing slash removal',data:{apiBaseUrlBefore,apiBaseUrlAfter:apiBaseUrl,startsWithDoubleSlash:apiBaseUrl.startsWith('//')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // CRITICAL FIX: If URL still starts with // (protocol-relative), prepend https:
    if (apiBaseUrl.startsWith('//')) {
      apiBaseUrl = 'https:' + apiBaseUrl;
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/65d9ad06-b70b-4149-bf19-de4e9e0d0599',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orders/[orderId]/page.tsx:64',message:'Fixed protocol-relative URL',data:{apiBaseUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    }
    
    // Construct the receipt URL properly, ensuring no double slashes
    const receiptUrl = `${apiBaseUrl}/api/inventory/orders/${orderId}/receipt/?format=pdf`;
    
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/65d9ad06-b70b-4149-bf19-de4e9e0d0599',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orders/[orderId]/page.tsx:70',message:'Final receipt URL constructed',data:{apiBaseUrl,receiptUrl,receiptUrlLength:receiptUrl.length,hasDoubleSlash:receiptUrl.includes('//'),startsWithDoubleSlash:receiptUrl.startsWith('//')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    console.log('Downloading receipt from URL:', receiptUrl);
    
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/65d9ad06-b70b-4149-bf19-de4e9e0d0599',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orders/[orderId]/page.tsx:77',message:'Calling window.open',data:{receiptUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // Open in new tab to download
    window.open(receiptUrl, '_blank');
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
              className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Ordered on: {new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

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
                        {item.inventory_unit?.product_name || 'Product'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity} × {formatPrice(parseFloat(item.unit_price_at_purchase))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {formatPrice(parseFloat(item.unit_price_at_purchase) * item.quantity)}
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
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatPrice(parseFloat(order.total_amount))}
              </span>
            </div>
            {order.customer_username && (
              <p className="text-sm text-gray-600">
                Customer: {order.customer_username}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={downloadReceipt}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Receipt
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
      <Header />
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

