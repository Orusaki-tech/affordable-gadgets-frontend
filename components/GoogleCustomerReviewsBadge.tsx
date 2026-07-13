'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    merchantwidget?: {
      start?: (opts: {
        merchant_id: number;
        position: string;
        region: string;
      }) => void;
    };
  }
}

type GoogleCustomerReviewsBadgeProps = {
  merchantId: number;
  position?: 'BOTTOM_RIGHT' | 'BOTTOM_LEFT' | 'TOP_RIGHT' | 'TOP_LEFT';
  region?: string;
};

function loadOnce(src: string, id: string) {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;
  const s = document.createElement('script');
  s.id = id;
  s.src = src;
  s.defer = true;
  document.head.appendChild(s);
}

function scheduleIdle(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const idleWindow = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };

  if (typeof idleWindow.requestIdleCallback === 'function') {
    const id = idleWindow.requestIdleCallback(callback, { timeout: 4000 });
    return () => idleWindow.cancelIdleCallback?.(id);
  }

  const t = window.setTimeout(callback, 2500);
  return () => window.clearTimeout(t);
}

export function GoogleCustomerReviewsBadge({
  merchantId,
  position = 'BOTTOM_RIGHT',
  region = 'KE',
}: GoogleCustomerReviewsBadgeProps) {
  useEffect(() => {
    let startTimer: ReturnType<typeof setTimeout> | undefined;

    const start = () => {
      try {
        window.merchantwidget?.start?.({
          merchant_id: merchantId,
          position,
          region,
        });
      } catch {
        // ignore
      }
    };

    const cancelIdle = scheduleIdle(() => {
      loadOnce(
        'https://www.gstatic.com/shopping/merchant/merchantwidget.js',
        'google-merchantwidget-js'
      );
      start();
      startTimer = setTimeout(start, 1000);
    });

    return () => {
      cancelIdle();
      if (startTimer) clearTimeout(startTimer);
    };
  }, [merchantId, position, region]);

  return null;
}
