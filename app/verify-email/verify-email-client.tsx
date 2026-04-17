'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { inventoryBaseUrl } from '@/lib/api/openapi';
import { brandConfig } from '@/lib/config/brand';

export function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    const uid = searchParams.get('uid');

    if (!token || !uid) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(`${inventoryBaseUrl}/verify-email/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Brand-Code': brandConfig.code,
          },
          body: JSON.stringify({ token, uid }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Verification failed.');
        }
        setStatus('success');
        setMessage(data?.message || 'Email verified successfully.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.message || 'Verification failed.');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl shadow p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
      <p className={`mb-6 ${status === 'error' ? 'text-red-600' : 'text-gray-700'}`}>
        {message}
      </p>
      {status === 'success' && (
        <p className="text-sm text-gray-500 mb-6">
          You can now sign in from the account icon.
        </p>
      )}
      <div className="space-y-3">
        <Link
          href="/cart"
          className="block w-full bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] font-semibold"
        >
          Go to Cart
        </Link>
        <Link
          href="/products"
          className="block w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-semibold"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
