'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { persistUTMParams } from '@/lib/utm';
import { trackPageView } from '@/lib/tracking';

const AuthOverlay = dynamic(
  () => import('./AuthOverlay').then((mod) => mod.AuthOverlay),
  { ssr: false }
);

export function AuthGate({ children }: { children: React.ReactNode }) {
  // null = not checked yet — never block SSR/first paint on auth
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    persistUTMParams();
    trackPageView();

    const sync = () => setIsAuthed(!!localStorage.getItem('auth_token'));
    sync();

    const handleAuthChange = () => sync();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'auth_token') sync();
    };

    window.addEventListener('auth-token-changed', handleAuthChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('auth-token-changed', handleAuthChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return (
    <>
      {children}
      {isAuthed === false && (
        <AuthOverlay onAuthSuccess={() => setIsAuthed(true)} />
      )}
    </>
  );
}
