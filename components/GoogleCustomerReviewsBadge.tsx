'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    merchantwidget?: any;
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

export function GoogleCustomerReviewsBadge({
  merchantId,
  position = 'BOTTOM_RIGHT',
  region = 'KE',
}: GoogleCustomerReviewsBadgeProps) {
  useEffect(() => {
    loadOnce('https://www.gstatic.com/shopping/merchant/merchantwidget.js', 'google-merchantwidget-js');

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

    // If script already present, try starting immediately; otherwise wait a bit.
    start();
    const t = window.setTimeout(start, 750);
    return () => window.clearTimeout(t);
  }, [merchantId, position, region]);

  return null;
}

