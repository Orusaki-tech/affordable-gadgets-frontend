import { apiBaseUrl, setAuthToken } from '@/lib/api/openapi';
import { getSessionKey } from '@/lib/tracking';
import { getStoredUTMParams } from '@/lib/utm';

/**
 * Exchange a Supabase session token for a Django auth token
 * by calling the backend's /api/auth/supabase/ endpoint.
 */
export async function exchangeSupabaseToken(accessToken: string): Promise<{ token: string } | null> {
  try {
    const utm = getStoredUTMParams();
    const body: Record<string, unknown> = {
      access_token: accessToken,
      session_key: getSessionKey(),
    };
    if (utm.utm_source) body.utm_source = utm.utm_source;
    if (utm.utm_medium) body.utm_medium = utm.utm_medium;
    if (utm.utm_campaign) body.utm_campaign = utm.utm_campaign;
    if (utm.utm_content) body.utm_content = utm.utm_content;

    const resp = await fetch(`${apiBaseUrl}/api/auth/supabase/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Brand-Code': 'AFFORDABLE_GADGETS',
      },
      body: JSON.stringify(body),
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
