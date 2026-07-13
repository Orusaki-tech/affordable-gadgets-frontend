'use client';

import { useEffect } from 'react';
import { persistUTMParams } from '@/lib/utm';
import { trackPageView } from '@/lib/tracking';

/**
 * Soft gate: guests can browse freely.
 * Login is required at cart/checkout (AuthChoiceModal on those flows).
 * This component only bootstraps UTM + page-view tracking.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    persistUTMParams();
    trackPageView();
  }, []);

  return <>{children}</>;
}
