import { OpenAPI } from '@shwari/api-client';
import { brandConfig } from '@/lib/config/brand';

const normalizedBaseUrl = brandConfig.apiBaseUrl.replace(/\/+$/, '');

export const apiBaseUrl = normalizedBaseUrl;
export const inventoryBaseUrl = `${normalizedBaseUrl}/api/inventory`;

OpenAPI.BASE = normalizedBaseUrl;
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
  }

  return headers;
};

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
    window.dispatchEvent(new Event('auth-token-changed'));
  }
};

export const clearAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    window.dispatchEvent(new Event('auth-token-changed'));
  }
};
