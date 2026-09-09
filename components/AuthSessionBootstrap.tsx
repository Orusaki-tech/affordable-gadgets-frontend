'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { exchangeSupabaseToken } from '@/lib/supabase/auth-exchange';
import { refreshSessionUser } from '@/lib/auth/load-session-user';

/**
 * Completes OAuth when Supabase lands on Site URL with ?code=,
 * and keeps Django token + display name in sync with the session.
 */
export function AuthSessionBootstrap() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) return;
    // Prefer the dedicated callback route so PKCE exchange stays server-side.
    if (pathname?.startsWith('/auth/callback')) return;

    const nextParams = new URLSearchParams();
    nextParams.set('code', code);
    nextParams.set('next', pathname || '/');
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
      const val = searchParams.get(key);
      if (val) nextParams.set(key, val);
    }
    router.replace(`/auth/callback?${nextParams.toString()}`);
  }, [pathname, router, searchParams]);

  useEffect(() => {
    let cancelled = false;

    const syncAuth = async () => {
      const hasToken = !!localStorage.getItem('auth_token');
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!hasToken && accessToken) {
          await exchangeSupabaseToken(accessToken);
        }
      } catch {
        // Ignore — signed-out visitors should not see auth noise.
      }
      if (cancelled) return;
      if (localStorage.getItem('auth_token')) {
        await refreshSessionUser();
      }
    };

    void syncAuth();

    const onAuthChange = () => {
      void syncAuth();
    };
    window.addEventListener('auth-token-changed', onAuthChange);
    return () => {
      cancelled = true;
      window.removeEventListener('auth-token-changed', onAuthChange);
    };
  }, []);

  return null;
}
