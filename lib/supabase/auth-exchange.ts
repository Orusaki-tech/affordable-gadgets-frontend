import { apiBaseUrl, setAuthToken } from '@/lib/api/openapi';

/**
 * Exchange a Supabase session token for a Django auth token
 * by calling the backend's /api/auth/supabase/ endpoint.
 */
export async function exchangeSupabaseToken(accessToken: string): Promise<{ token: string } | null> {
  try {
    const resp = await fetch(`${apiBaseUrl}/api/auth/supabase/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Brand-Code': 'AFFORDABLE_GADGETS',
      },
      body: JSON.stringify({ access_token: accessToken }),
    });

    if (!resp.ok) {
      console.warn('Supabase token exchange failed:', resp.status);
      return null;
    }

    const data = await resp.json();
    if (data?.token) {
      setAuthToken(data.token);
      return data;
    }
    return null;
  } catch (err) {
    console.error('Supabase token exchange error:', err);
    return null;
  }
}
