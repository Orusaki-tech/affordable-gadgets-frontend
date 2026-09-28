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

/** Always prefix an internal shop href with /studio (no enable flag). */
export function prefixStudioPath(href: string): string {
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

  const hashIndex = trimmed.indexOf('#');
  const hash = hashIndex >= 0 ? trimmed.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed;
  const [pathPart, query = ''] = withoutHash.split('?');
  const path = pathPart || '/';
  const qs = query ? `?${query}` : '';

  if (path === '/') return `/studio${qs}${hash}`;
  return `/studio${path.startsWith('/') ? path : `/${path}`}${qs}${hash}`;
}

/** Prefix an internal href for Studio when routing is enabled, or return unchanged. */
export function studioPath(href: string): string {
  if (!studioRoutingEnabled) return href;
  return prefixStudioPath(href);
}

export function isStudioBrowserPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === '/studio' || pathname.startsWith('/studio/');
}

export function isStudioLoginPath(pathname: string | null | undefined): boolean {
  return pathname === '/studio/login' || pathname?.startsWith('/studio/login/') === true;
}
