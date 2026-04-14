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
    <div className="verify-email-card">
      <h1 className="verify-email-card__title">Email Verification</h1>
      <p
        className={
          status === 'error'
            ? 'verify-email-card__message verify-email-card__message--error'
            : 'verify-email-card__message'
        }
      >
        {message}
      </p>
      {status === 'success' && (
        <p className="verify-email-card__hint">You can now sign in from the account icon.</p>
      )}
      <div className="u-space-y-3">
        <Link href="/cart" className="u-btn u-btn--primary">
          Go to Cart
        </Link>
        <Link href="/products" className="u-btn u-btn--neutral">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
