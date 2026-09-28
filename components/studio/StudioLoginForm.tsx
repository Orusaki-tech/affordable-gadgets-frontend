'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStudioAuth } from '@/components/studio/StudioAuthContext';
import { StudioApiError } from '@/lib/studio/api';

export function StudioLoginForm() {
  const { login, isAuthenticated } = useStudioAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/studio/products';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return (
      <div className="studio-login">
        <p>Already signed in. Redirecting…</p>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      router.replace(next.startsWith('/studio') ? next : '/studio/products');
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Login failed'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="studio-login">
      <div className="studio-login__card">
        <p className="studio-login__eyebrow">Affordable Gadgets KE</p>
        <h1 className="studio-login__title">Visual Studio</h1>
        <p className="studio-login__sub">
          Staff sign-in. Edit products against the live storefront look. Ops (stock, orders,
          leads) stay in the inventory admin.
        </p>
        <form className="studio-login__form" onSubmit={handleSubmit}>
          <label className="studio-field">
            <span>Username or email</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={submitting}
            />
          </label>
          <label className="studio-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
            />
          </label>
          {error && (
            <div className="studio-alert" role="alert">
              {error}
            </div>
          )}
          <button type="submit" className="studio-btn studio-btn--primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
