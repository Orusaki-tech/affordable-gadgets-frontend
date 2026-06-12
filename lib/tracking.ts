import { brandConfig } from '@/lib/config/brand';
import { getStoredUTMParams } from '@/lib/utm';

const API_BASE = brandConfig.apiBaseUrl.replace(/\/+$/, '');
const EVENTS_URL = `${API_BASE}/api/v1/public/events/`;

export function getSessionKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    let key = localStorage.getItem('session_key');
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem('session_key', key);
    }
    return key;
  } catch {
    return '';
  }
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

async function sendEvent(eventType: string, extra: Record<string, unknown> = {}) {
  const token = getAuthToken();
  const metadata: Record<string, unknown> = { ...extra };
  const utm = getStoredUTMParams();
  if (utm.utm_source) metadata.utm_source = utm.utm_source;
  if (utm.utm_medium) metadata.utm_medium = utm.utm_medium;
  if (utm.utm_campaign) metadata.utm_campaign = utm.utm_campaign;
  if (utm.utm_content) metadata.utm_content = utm.utm_content;

  const { product_id, ...metadataRest } = metadata;
  const body: Record<string, unknown> = {
    event_type: eventType,
    session_key: getSessionKey(),
    metadata: metadataRest,
  };
  if (product_id !== undefined) {
    body.product_id = product_id;
  }

  try {
    await fetch(EVENTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Brand-Code': brandConfig.code,
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
  }
}

export function trackSearch(searchQuery: string) {
  if (!searchQuery.trim()) return;
  sendEvent('search', { search_query: searchQuery });
}

export async function trackProductView(productId: number | string) {
  const token = getAuthToken();
  const utm = getStoredUTMParams();
  const metadata: Record<string, unknown> = {};
  if (utm.utm_source) metadata.utm_source = utm.utm_source;
  if (utm.utm_medium) metadata.utm_medium = utm.utm_medium;
  if (utm.utm_campaign) metadata.utm_campaign = utm.utm_campaign;
  if (utm.utm_content) metadata.utm_content = utm.utm_content;

  const body: Record<string, unknown> = {
    event_type: 'product_view',
    product_id: typeof productId === 'string' ? parseInt(productId) || productId : productId,
    session_key: getSessionKey(),
    metadata,
  };

  try {
    await fetch(EVENTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Brand-Code': brandConfig.code,
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
  }
}

export function trackPageView(path?: string) {
  sendEvent('page_view', { path: path || (typeof window !== 'undefined' ? window.location.pathname : '') });
}

export function trackCartAdd(productId: number | string) {
  sendEvent('cart_add', { product_id: productId });
}

export function trackWhatsAppClick(productId: number | string) {
  sendEvent('whatsapp_click', { product_id: productId });
}
