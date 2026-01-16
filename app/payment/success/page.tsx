'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { brandConfig } from '@/lib/config/brand';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const paymentReference = searchParams.get('payment_reference');

  const downloadReceipt = () => {
    if (!orderId) return;
    
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/65d9ad06-b70b-4149-bf19-de4e9e0d0599',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payment/success/page.tsx:16',message:'downloadReceipt called',data:{orderId,brandConfigApiBaseUrl:brandConfig.apiBaseUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // Get API base URL from brand config
    let apiBaseUrl = brandConfig.apiBaseUrl || 'http://localhost:8000';
    
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/65d9ad06-b70b-4149-bf19-de4e9e0d0599',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payment/success/page.tsx:20',message:'Base URL from brandConfig',data:{apiBaseUrl,hasTrailingSlash:apiBaseUrl.endsWith('/'),isEmpty:!apiBaseUrl || apiBaseUrl.trim() === '',isRelative:apiBaseUrl.startsWith('/') && !apiBaseUrl.startsWith('http')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // Fix: Handle empty, relative, or malformed base URLs
    // If base URL is empty, relative (starts with /), or doesn't start with http/https, use window.location.origin
    if (!apiBaseUrl || apiBaseUrl.trim() === '' || (apiBaseUrl.startsWith('/') && !apiBaseUrl.startsWith('http'))) {
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/65d9ad06-b70b-4149-bf19-de4e9e0d0599',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payment/success/page.tsx:25',message:'Fixing malformed base URL',data:{originalApiBaseUrl:apiBaseUrl,windowOrigin:typeof window !== 'undefined' ? window.location.origin : 'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
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
    fetch('http://127.0.0.1:7248/ingest/65d9ad06-b70b-4149-bf19-de4e9e0d0599',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payment/success/page.tsx:35',message:'After trailing slash removal',data:{apiBaseUrlBefore,apiBaseUrlAfter:apiBaseUrl,startsWithDoubleSlash:apiBaseUrl.startsWith('//')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // CRITICAL FIX: If URL still starts with // (protocol-relative), prepend https:
    if (apiBaseUrl.startsWith('//')) {
      apiBaseUrl = 'https:' + apiBaseUrl;
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/65d9ad06-b70b-4149-bf19-de4e9e0d0599',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payment/success/page.tsx:41',message:'Fixed protocol-relative URL',data:{apiBaseUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    }
    
    // Construct the receipt URL properly, ensuring no double slashes
    const receiptUrl = `${apiBaseUrl}/api/inventory/orders/${orderId}/receipt/?format=pdf`;
    
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/65d9ad06-b70b-4149-bf19-de4e9e0d0599',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payment/success/page.tsx:47',message:'Final receipt URL constructed',data:{apiBaseUrl,receiptUrl,receiptUrlLength:receiptUrl.length,hasDoubleSlash:receiptUrl.includes('//'),startsWithDoubleSlash:receiptUrl.startsWith('//')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    console.log('Downloading receipt from URL:', receiptUrl);
    
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/65d9ad06-b70b-4149-bf19-de4e9e0d0599',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payment/success/page.tsx:54',message:'Calling window.open',data:{receiptUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // Open in new tab to download
    window.open(receiptUrl, '_blank');
  };

  return (
    <main className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
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
          </div>
          <div className="space-y-2">
            {orderId && (
              <button
                onClick={downloadReceipt}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Receipt
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

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Suspense fallback={
        <main className="flex-1 flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
            <div className="animate-pulse">
              <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
            </div>
          </div>
        </main>
      }>
        <PaymentSuccessContent />
      </Suspense>
      <Footer />
    </div>
  );
}









