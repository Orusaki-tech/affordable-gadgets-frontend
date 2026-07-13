import { getSessionKey } from '@/lib/tracking';
import { getStoredUTMParams } from '@/lib/utm';

/** Fields to attach anonymous browse attribution when authenticating. */
export function getAuthAttributionFields(): {
  session_key?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
} {
  const session_key = getSessionKey();
  const utm = getStoredUTMParams();
  return {
    ...(session_key ? { session_key } : {}),
    ...(utm.utm_source ? { utm_source: utm.utm_source } : {}),
    ...(utm.utm_medium ? { utm_medium: utm.utm_medium } : {}),
    ...(utm.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
    ...(utm.utm_content ? { utm_content: utm.utm_content } : {}),
  };
}
