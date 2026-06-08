'use client';

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
}

const UTM_COOKIE_KEY = 'utm_params';

export function captureUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const utm: UTMParams = {};
  const source = params.get('utm_source');
  const medium = params.get('utm_medium');
  const campaign = params.get('utm_campaign');
  const content = params.get('utm_content');
  if (source) utm.utm_source = source;
  if (medium) utm.utm_medium = medium;
  if (campaign) utm.utm_campaign = campaign;
  if (content) utm.utm_content = content;
  return utm;
}

export function persistUTMParams(): void {
  if (typeof window === 'undefined') return;
  const utm = captureUTMParams();
  if (Object.keys(utm).length === 0) return;
  try {
    localStorage.setItem(UTM_COOKIE_KEY, JSON.stringify(utm));
  } catch {
  }
}

export function getStoredUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(UTM_COOKIE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
  }
  return {};
}

export function clearUTMParams(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(UTM_COOKIE_KEY);
  } catch {
  }
}
