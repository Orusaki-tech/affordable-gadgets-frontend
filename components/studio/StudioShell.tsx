'use client';

import Link from 'next/link';
import { Suspense, useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStudioAuth } from '@/components/studio/StudioAuthContext';
import { StudioEditHost } from '@/components/studio/StudioEditHost';

export function StudioShell({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated, user, profile, logout, capabilities } =
    useStudioAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/studio/login';

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !isLogin) {
      router.replace(`/studio/login?next=${encodeURIComponent(pathname || '/studio')}`);
    }
    if (isAuthenticated && isLogin) {
      router.replace('/studio/products');
    }
  }, [loading, isAuthenticated, isLogin, pathname, router]);

  if (loading) {
    return (
      <div className="studio-shell studio-shell--loading">
        <p>Loading studio…</p>
      </div>
    );
  }

  if (!isAuthenticated || isLogin) {
    return <>{children}</>;
  }

  const displayName =
    user?.username || profile?.username || user?.email || profile?.email || 'Staff';

  return (
    <div className="studio-mirror-root">
      <div className="studio-float-bar" role="banner">
        <div className="studio-float-bar__left">
          <span className="studio-float-bar__mark">Studio</span>
          <span className="studio-float-bar__role" title={capabilities.editableSummary}>
            {capabilities.roleLabel}
          </span>
          <span className="studio-float-bar__hint">{capabilities.editableSummary}</span>
        </div>
        <div className="studio-float-bar__actions">
          {capabilities.canCreateProduct && (
            <Link href="/studio/products?new=1" className="studio-float-bar__btn studio-float-bar__btn--lime">
              Add product
            </Link>
          )}
          <a
            href="/products"
            target="_blank"
            rel="noopener noreferrer"
            className="studio-float-bar__btn"
          >
            Shop view
          </a>
          <span className="studio-float-bar__user">{displayName}</span>
          <button type="button" className="studio-float-bar__btn" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
      {capabilities.readOnlyReason && (
        <div className="studio-shell__banner studio-shell__banner--float" role="status">
          {capabilities.readOnlyReason}
        </div>
      )}
      <Suspense fallback={<div className="studio-mirror-pad">{children}</div>}>
        <StudioEditHost>
          <div className="studio-mirror-pad">{children}</div>
        </StudioEditHost>
      </Suspense>
    </div>
  );
}
