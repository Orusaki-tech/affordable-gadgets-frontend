/**
 * Google Ads (gtag) helpers.
 * Base tag AW-18481600649 is loaded in app/layout.tsx.
 *
 * Optional conversion labels (from Google Ads → Goals → Conversions → Tag setup):
 *   NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL  e.g. AbCdEfGhIjKlMnOp
 *   NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL
 * When set, fires gtag conversion events with send_to. Without labels, still
 * fires purchase / generate_lead so Ads URL-based or secondary goals can use them.
 */

export const GOOGLE_ADS_ID = 'AW-18481600649';

type GtagFunction = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFunction;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag(...args);
}

function sendTo(label: string | undefined): string | null {
  const trimmed = label?.trim();
  if (!trimmed) return null;
  return `${GOOGLE_ADS_ID}/${trimmed}`;
}

function alreadyFired(key: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (window.sessionStorage.getItem(key) === '1') return true;
    window.sessionStorage.setItem(key, '1');
    return false;
  } catch {
    return false;
  }
}

export type PurchaseConversionParams = {
  transactionId: string;
  value?: number | null;
  currency?: string;
};

/** Fire once per order on the payment success page. */
export function trackGoogleAdsPurchase(params: PurchaseConversionParams) {
  const transactionId = params.transactionId?.trim();
  if (!transactionId) return;
  if (alreadyFired(`gads-purchase:${transactionId}`)) return;

  const value =
    typeof params.value === 'number' && Number.isFinite(params.value) && params.value >= 0
      ? params.value
      : undefined;
  const currency = params.currency || 'KES';

  gtag('event', 'purchase', {
    transaction_id: transactionId,
    ...(value !== undefined ? { value } : {}),
    currency,
  });

  const conversionSendTo = sendTo(process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL);
  if (conversionSendTo) {
    gtag('event', 'conversion', {
      send_to: conversionSendTo,
      ...(value !== undefined ? { value } : {}),
      currency,
      transaction_id: transactionId,
    });
  }
}

export type LeadConversionParams = {
  /** Deduping key, e.g. productId or "repair" */
  leadKey: string;
  value?: number | null;
  currency?: string;
};

/** Fire for WhatsApp / repair lead submissions. */
export function trackGoogleAdsLead(params: LeadConversionParams) {
  const leadKey = params.leadKey?.trim();
  if (!leadKey) return;
  if (alreadyFired(`gads-lead:${leadKey}`)) return;

  const value =
    typeof params.value === 'number' && Number.isFinite(params.value) && params.value >= 0
      ? params.value
      : undefined;
  const currency = params.currency || 'KES';

  gtag('event', 'generate_lead', {
    ...(value !== undefined ? { value } : {}),
    currency,
  });

  const conversionSendTo = sendTo(process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL);
  if (conversionSendTo) {
    gtag('event', 'conversion', {
      send_to: conversionSendTo,
      ...(value !== undefined ? { value } : {}),
      currency,
    });
  }
}
