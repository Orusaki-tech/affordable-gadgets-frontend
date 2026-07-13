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

const MERCHANT_IFRAME_TITLE = 'Google Customer Reviews';

function loadOnce(src: string, id: string) {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;
  const s = document.createElement('script');
  s.id = id;
  s.src = src;
  s.defer = true;
  document.head.appendChild(s);
}

function ensureMerchantIframeTitle() {
  if (typeof document === 'undefined') return;
  const iframe = document.getElementById(
    'merchantwidgetiframe'
  ) as HTMLIFrameElement | null;
  if (iframe && iframe.getAttribute('title') !== MERCHANT_IFRAME_TITLE) {
    iframe.setAttribute('title', MERCHANT_IFRAME_TITLE);
  }
}

/** Defer heavy Google Merchant JS until interaction or a long idle — keeps it off the LCP/TBT critical path. */
function scheduleDeferred(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    callback();
  };

  const onInteract = () => run();
  const events: Array<keyof WindowEventMap> = [
    'scroll',
    'pointerdown',
    'keydown',
    'touchstart',
  ];

  const cleanup = () => {
    events.forEach((event) => window.removeEventListener(event, onInteract));
    window.clearTimeout(fallbackTimer);
  };

  events.forEach((event) =>
    window.addEventListener(event, onInteract, { once: true, passive: true })
  );
  // Long fallback so lab audits typically finish without downloading ~280KB of unused Google JS.
  const fallbackTimer = window.setTimeout(run, 15000);

  return () => {
    done = true;
    cleanup();
  };
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
      ensureMerchantIframeTitle();
    };

    const cancelDeferred = scheduleDeferred(() => {
      loadOnce(
        'https://www.gstatic.com/shopping/merchant/merchantwidget.js',
        'google-merchantwidget-js'
      );
      start();
      startTimer = setTimeout(start, 1000);
    });

    const observer = new MutationObserver(ensureMerchantIframeTitle);
    observer.observe(document.body, { childList: true, subtree: true });
    ensureMerchantIframeTitle();

    return () => {
      cancelDeferred();
      if (startTimer) clearTimeout(startTimer);
      observer.disconnect();
    };
  }, [merchantId, position, region]);

  return null;
}
