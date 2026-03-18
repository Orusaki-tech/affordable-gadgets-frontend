'use client';

import { useEffect, useMemo } from 'react';

declare global {
  interface Window {
    gapi?: any;
    renderOptIn?: () => void;
  }
}

type GoogleCustomerReviewsOptInProps = {
  merchantId: number;
  orderId: string;
  email: string;
  deliveryCountry: string; // ISO 3166-1 alpha-2 (e.g. "KE")
  estimatedDeliveryDate: string; // YYYY-MM-DD
  gtins?: string[];
};

function loadOnce(src: string, id: string) {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;
  const s = document.createElement('script');
  s.id = id;
  s.src = src;
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
}

export function GoogleCustomerReviewsOptIn(props: GoogleCustomerReviewsOptInProps) {
  const products = useMemo(() => {
    const gtins = (props.gtins || []).map((g) => g.trim()).filter(Boolean);
    if (!gtins.length) return undefined;
    return gtins.map((gtin) => ({ gtin }));
  }, [props.gtins]);

  useEffect(() => {
    if (!props.orderId || !props.email || !props.deliveryCountry || !props.estimatedDeliveryDate) return;

    // Load platform.js and register renderOptIn callback (Google calls it when ready).
    loadOnce('https://apis.google.com/js/platform.js?onload=renderOptIn', 'google-platform-js');

    window.renderOptIn = function renderOptIn() {
      try {
        window.gapi?.load('surveyoptin', () => {
          window.gapi?.surveyoptin?.render({
            merchant_id: props.merchantId,
            order_id: props.orderId,
            email: props.email,
            delivery_country: props.deliveryCountry,
            estimated_delivery_date: props.estimatedDeliveryDate,
            ...(products ? { products } : {}),
          });
        });
      } catch {
        // If Google script isn't ready yet, platform.js will call onload again after it loads.
      }
    };

    // If the script was already loaded earlier, trigger immediately.
    if (window.gapi) {
      window.renderOptIn?.();
    }
  }, [
    props.merchantId,
    props.orderId,
    props.email,
    props.deliveryCountry,
    props.estimatedDeliveryDate,
    products,
  ]);

  return null;
}

