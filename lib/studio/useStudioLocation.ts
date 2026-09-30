'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  getStudioWindowPathname,
  isStudioBrowserPath,
  isStudioLoginPath,
} from '@/lib/studio/paths';

/**
 * Studio detection that survives middleware rewrites.
 * Next usePathname() may report the rewritten shop path; the address bar keeps /studio/*.
 *
 * Important: do not treat `/studio` as in-studio until the window path is known.
 * Middleware rewrites `/studio` → `/`, and usePathname can disagree between SSR and
 * the first client paint — that mismatch hydrates as React #418 and crashes Studio.
 * `/studio/login` is not rewritten, so it is safe to detect from Next's pathname.
 */
export function useStudioLocation() {
  const nextPathname = usePathname();
  const [browserPathname, setBrowserPathname] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setBrowserPathname(getStudioWindowPathname());
    sync();
    setReady(true);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [nextPathname]);

  const loginFromNext = isStudioLoginPath(nextPathname);
  const pathname = ready ? browserPathname ?? nextPathname : nextPathname;

  const inStudio = ready
    ? isStudioBrowserPath(browserPathname) || isStudioBrowserPath(pathname)
    : loginFromNext;

  const isLogin = ready
    ? isStudioLoginPath(browserPathname) || isStudioLoginPath(pathname)
    : loginFromNext;

  return {
    pathname,
    nextPathname,
    browserPathname,
    ready,
    inStudio,
    isLogin,
  };
}
