'use client';

import { OpenAPI } from '@shwari/api-client';
import { apiBaseUrl } from '@/lib/api/openapi';

const SESSION_KEY_STORAGE = 'session_key';
const CUSTOMER_PHONE_STORAGE = 'customer_phone';

export type WishlistProductSummary = {
  id?: number;
  product_name?: string;
  slug?: string;
  primary_image?: string | null;
  min_price?: number;
  max_price?: number;
  compare_at_min_price?: number | null;
  compare_at_max_price?: number | null;
  discount_percent?: number | null;
  review_count?: number;
  average_rating?: number | null;
};

export type WishlistItem = {
  id: number;
  product?: WishlistProductSummary;
  product_id?: number;
  created_at?: string;
};

function getOrCreateSessionKey() {
  if (typeof window === 'undefined') return undefined;
  let sessionKey = localStorage.getItem(SESSION_KEY_STORAGE);
  if (!sessionKey) {
    sessionKey = `session_${Date.now()}`;
    localStorage.setItem(SESSION_KEY_STORAGE, sessionKey);
  }
  return sessionKey;
}

function getCustomerPhone() {
  if (typeof window === 'undefined') return undefined;
  const phone = localStorage.getItem(CUSTOMER_PHONE_STORAGE);
  return phone || undefined;
}

async function getHeaders() {
  const rawHeaders = OpenAPI.HEADERS;
  let headers: Record<string, string> = {};

  if (typeof rawHeaders === 'function') {
    const resolved = await rawHeaders({} as any);
    headers = resolved instanceof Headers ? Object.fromEntries(resolved.entries()) : resolved;
  } else if (rawHeaders instanceof Headers) {
    headers = Object.fromEntries(rawHeaders.entries());
  } else if (rawHeaders) {
    headers = rawHeaders;
  }

  return {
    ...headers,
    'Content-Type': 'application/json',
  };
}

async function request<T>(path: string, options?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...(options?.headers ?? {}),
      ...(await getHeaders()),
    },
  });

  if (!response.ok) {
    throw new Error(`Wishlist request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchWishlist(): Promise<WishlistItem[]> {
  const sessionKey = getOrCreateSessionKey();
  const customerPhone = getCustomerPhone();
  const params = new URLSearchParams();
  if (sessionKey) params.set('session_key', sessionKey);
  if (customerPhone) params.set('customer_phone', customerPhone);
  const data = await request<{ results?: WishlistItem[] }>(`/api/v1/public/wishlist/?${params.toString()}`);
  return data?.results ?? [];
}

export async function addWishlistItem(productId: number): Promise<WishlistItem | undefined> {
  const sessionKey = getOrCreateSessionKey();
  const customerPhone = getCustomerPhone();
  return request<WishlistItem>(`/api/v1/public/wishlist/`, {
    method: 'POST',
    body: JSON.stringify({
      product_id: productId,
      session_key: sessionKey,
      customer_phone: customerPhone,
    }),
  });
}

export async function removeWishlistItem(productId: number): Promise<void> {
  const sessionKey = getOrCreateSessionKey();
  const customerPhone = getCustomerPhone();
  const params = new URLSearchParams();
  params.set('product_id', String(productId));
  if (sessionKey) params.set('session_key', sessionKey);
  if (customerPhone) params.set('customer_phone', customerPhone);
  await request<void>(`/api/v1/public/wishlist/by-product/?${params.toString()}`, {
    method: 'DELETE',
  });
}
