'use client';

import { useEffect, useState } from 'react';
import { AuthOverlay } from './AuthOverlay';
import { persistUTMParams } from '@/lib/utm';
import { trackPageView } from '@/lib/tracking';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    persistUTMParams();
    trackPageView();
    setIsAuthed(!!localStorage.getItem('auth_token'));
    const handleAuthChange = () => setIsAuthed(!!localStorage.getItem('auth_token'));
    window.addEventListener('auth-token-changed', handleAuthChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'auth_token') setIsAuthed(!!e.newValue);
    });
    return () => {
      window.removeEventListener('auth-token-changed', handleAuthChange);
    };
  }, []);

  if (isAuthed === null) {
    return (
      <div className="auth-gate-loading">
        <div className="auth-gate-loading__spinner" />
      </div>
    );
  }

  return (
    <>
      {children}
      {!isAuthed && <AuthOverlay onAuthSuccess={() => setIsAuthed(true)} />}
    </>
  );
}
