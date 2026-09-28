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

/**
 * Prefer the address-bar path. Middleware rewrites /studio/* → shop routes, so
 * Next's usePathname() often returns the rewritten shop path and would hide Studio UI.
 */
export function getStudioWindowPathname(): string | null {
  if (typeof window === 'undefined') return null;
  return window.location.pathname;
}

export function isStudioWindowPath(): boolean {
  return isStudioBrowserPath(getStudioWindowPathname());
}

/** Paths that must never be rewritten into /studio. */
export function shouldSkipStudioPrefix(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/studio') ||
    pathname.startsWith('/auth/') ||
    pathname.includes('.')
  );
}

/**
 * Patch history so Next.js router.push/replace stay under /studio.
 * Returns an uninstall function.
 */
export function installStudioHistoryGuard(): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const originalPush = history.pushState.bind(history);
  const originalReplace = history.replaceState.bind(history);

  const rewrite = (url: string | URL | null | undefined): string | URL | null | undefined => {
    if (url == null) return url;
    try {
      const asString = typeof url === 'string' ? url : url.toString();
      const parsed = new URL(asString, window.location.origin);
      if (parsed.origin !== window.location.origin) return url;
      if (shouldSkipStudioPrefix(parsed.pathname)) return url;
      return prefixStudioPath(`${parsed.pathname}${parsed.search}${parsed.hash}`);
    } catch {
      return url;
    }
  };

  history.pushState = function studioPushState(data, unused, url) {
    return originalPush(data, unused, rewrite(url) as string | URL | null | undefined);
  };

  history.replaceState = function studioReplaceState(data, unused, url) {
    return originalReplace(data, unused, rewrite(url) as string | URL | null | undefined);
  };

  return () => {
    history.pushState = originalPush;
    history.replaceState = originalReplace;
  };
}
