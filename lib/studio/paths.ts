/**
 * When Studio routing is enabled, map shop paths onto /studio/*.
 * Enabled from the client while the browser URL is under /studio.
 */

let studioRoutingEnabled = false;

export function setStudioRoutingEnabled(enabled: boolean) {
  studioRoutingEnabled = enabled;
}

export function isStudioRoutingEnabled() {
  return studioRoutingEnabled;
}

/** Prefix an internal href for Studio, or return unchanged. */
export function studioPath(href: string): string {
  if (!studioRoutingEnabled) return href;
  const trimmed = href.trim();
  if (!trimmed) return trimmed;
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('wa.me') ||
    trimmed.includes('://')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('/studio')) return trimmed;

  const [pathPart, query = ''] = trimmed.split('?');
  const path = pathPart || '/';
  const qs = query ? `?${query}` : '';

  if (path === '/') return `/studio${qs}`;
  return `/studio${path.startsWith('/') ? path : `/${path}`}${qs}`;
}

export function isStudioBrowserPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === '/studio' || pathname.startsWith('/studio/');
}

export function isStudioLoginPath(pathname: string | null | undefined): boolean {
  return pathname === '/studio/login' || pathname?.startsWith('/studio/login/') === true;
}
