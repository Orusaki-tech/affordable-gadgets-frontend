import { OpenAPI } from '@shwari/api-client';
import { brandConfig } from '@/lib/config/brand';

const normalizedBaseUrl = brandConfig.apiBaseUrl.replace(/\/+$/, '');

export const apiBaseUrl = normalizedBaseUrl;
export const inventoryBaseUrl = `${normalizedBaseUrl}/api/inventory`;

OpenAPI.BASE = apiBaseUrl;
// Use 'omit' so CORS works when backend/ngrok returns Access-Control-Allow-Origin: *
// (browsers reject * when credentials are 'include'). Auth uses Authorization header, not cookies.
OpenAPI.WITH_CREDENTIALS = false;
OpenAPI.CREDENTIALS = 'omit';
OpenAPI.HEADERS = async () => {
  const headers: Record<string, string> = {
    'X-Brand-Code': brandConfig.code,
    // Skip ngrok free-tier interstitial so API responses are JSON, not HTML
    'ngrok-skip-browser-warning': '1',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    const sessionKey = localStorage.getItem('session_key');
    if (sessionKey) {
      headers['X-Session-Key'] = sessionKey;
    }
  }

  return headers;
};

/**
 * Run an OpenAPI client call against `/api/inventory` and always restore BASE.
 * Uses a depth counter so nested/parallel withInventoryApiBase calls don't restore
 * the root base while another inventory call is still in flight.
 */
let inventoryBaseDepth = 0;
let inventoryBaseRoot: string | null = null;

export async function withInventoryApiBase<T>(fn: () => Promise<T>): Promise<T> {
  if (inventoryBaseDepth === 0) {
    inventoryBaseRoot = OpenAPI.BASE;
  }
  inventoryBaseDepth += 1;
  OpenAPI.BASE = inventoryBaseUrl;
  try {
    return await fn();
  } finally {
    inventoryBaseDepth -= 1;
    if (inventoryBaseDepth === 0) {
      OpenAPI.BASE = inventoryBaseRoot ?? apiBaseUrl;
      inventoryBaseRoot = null;
    } else {
      OpenAPI.BASE = inventoryBaseUrl;
    }
  }
}

/** Run an inventory API call with extra request headers (e.g. Idempotency-Key). */
export async function withInventoryApiHeaders<T>(
  extraHeaders: Record<string, string>,
  fn: () => Promise<T>
): Promise<T> {
  const previousHeaders = OpenAPI.HEADERS;
  OpenAPI.HEADERS = async (options) => {
    const base =
      typeof previousHeaders === 'function'
        ? await previousHeaders(options as any)
        : ((previousHeaders as Record<string, string> | undefined) ?? {});
    return { ...base, ...extraHeaders };
  };
  try {
    return await withInventoryApiBase(fn);
  } finally {
    OpenAPI.HEADERS = previousHeaders;
  }
}

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
    window.dispatchEvent(new Event('auth-token-changed'));
  }
};

export const clearAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    // Keep identity cleanup next to token clear so header UI resets.
    localStorage.removeItem('auth_user');
    window.dispatchEvent(new Event('auth-token-changed'));
    window.dispatchEvent(new Event('auth-user-changed'));
  }
};
