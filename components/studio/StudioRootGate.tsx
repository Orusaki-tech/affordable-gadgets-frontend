'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { StudioAuthProvider } from '@/components/studio/StudioAuthContext';
import { StudioShell } from '@/components/studio/StudioShell';
import {
  installStudioHistoryGuard,
  isStudioBrowserPath,
  isStudioLoginPath,
  prefixStudioPath,
  setStudioRoutingEnabled,
} from '@/lib/studio/paths';

/**
 * When the browser URL is under /studio (except login), wrap the shop page
 * with Studio auth + float bar, and keep in-app links inside /studio.
 */
export function StudioRootGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const inStudio = isStudioBrowserPath(pathname);
  const isLogin = isStudioLoginPath(pathname);

  // Sync during render so studioPath()/getProductHref work on the same tick as clicks.
  setStudioRoutingEnabled(inStudio && !isLogin);

  useEffect(() => {
    setStudioRoutingEnabled(inStudio && !isLogin);
    return () => setStudioRoutingEnabled(false);
  }, [inStudio, isLogin]);

  // Keep Next.js router.push/replace under /studio (filters, cart, search, etc.).
  useEffect(() => {
    if (!inStudio || isLogin) return;
    return installStudioHistoryGuard();
  }, [inStudio, isLogin]);

  // Keep same-origin <a>/<Link> navigations under /studio while editing.
  // Capture + stopImmediatePropagation so Next.js <Link> cannot also push the bare shop URL.
  useEffect(() => {
    if (!inStudio || isLogin) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest?.('a');
      if (!anchor) return;

      const hrefAttr = anchor.getAttribute('href');
      if (!hrefAttr) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      let url: URL;
      try {
        url = new URL(hrefAttr, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      // Already a studio URL — let Next handle it.
      if (isStudioBrowserPath(url.pathname)) return;

      const next = prefixStudioPath(`${url.pathname}${url.search}${url.hash}`);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      router.push(next);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [inStudio, isLogin, router]);

  if (!inStudio) {
    return <>{children}</>;
  }

  if (isLogin) {
    return <StudioAuthProvider>{children}</StudioAuthProvider>;
  }

  return (
    <StudioAuthProvider>
      <StudioShell>{children}</StudioShell>
    </StudioAuthProvider>
  );
}
