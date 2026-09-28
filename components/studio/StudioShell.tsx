'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useStudioAuth } from '@/components/studio/StudioAuthContext';

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

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  if (isLogin) {
    return <>{children}</>;
  }

  const displayName =
    user?.username || profile?.username || user?.email || profile?.email || 'Staff';

  return (
    <div className="studio-shell">
      <header className="studio-shell__header">
        <div className="studio-shell__brand">
          <Link href="/studio/products" className="studio-shell__logo">
            Visual Studio
          </Link>
          <span className="studio-shell__eyebrow">Staff only · mirrors storefront</span>
        </div>
        <nav className="studio-shell__nav" aria-label="Studio">
          <Link
            href="/studio/products"
            className={`studio-shell__nav-link${
              pathname?.startsWith('/studio/products') ? ' is-active' : ''
            }`}
          >
            Products
          </Link>
          {capabilities.canCreate && (
            <Link
              href="/studio/products/new"
              className={`studio-shell__nav-link${
                pathname === '/studio/products/new' ? ' is-active' : ''
              }`}
            >
              Add product
            </Link>
          )}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="studio-shell__nav-link"
          >
            View shop
          </a>
        </nav>
        <div className="studio-shell__user">
          <span className="studio-shell__user-name">{displayName}</span>
          <button type="button" className="studio-shell__logout" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      {capabilities.readOnlyReason && (
        <div className="studio-shell__banner" role="status">
          {capabilities.readOnlyReason}
        </div>
      )}
      <main className="studio-shell__main">{children}</main>
    </div>
  );
}
