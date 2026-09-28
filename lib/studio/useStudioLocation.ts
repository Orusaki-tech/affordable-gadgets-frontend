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
 */
export function useStudioLocation() {
  const nextPathname = usePathname();
  const [browserPathname, setBrowserPathname] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setBrowserPathname(getStudioWindowPathname());
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [nextPathname]);

  const pathname = browserPathname ?? nextPathname;
  return {
    pathname,
    nextPathname,
    browserPathname,
    inStudio: isStudioBrowserPath(pathname) || isStudioBrowserPath(browserPathname),
    isLogin: isStudioLoginPath(pathname) || isStudioLoginPath(browserPathname),
  };
}
