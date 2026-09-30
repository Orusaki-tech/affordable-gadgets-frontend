'use client';

import Link from 'next/link';
import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useStudioAuth } from '@/components/studio/StudioAuthContext';
import { StudioEditHost, useStudioEditOptional } from '@/components/studio/StudioEditHost';

function StudioFloatActions() {
  const studioEdit = useStudioEditOptional();
  const capabilities = studioEdit?.capabilities;
  if (!capabilities) return null;

  return (
    <>
      {capabilities.canCreateProduct && (
        <Link href="/studio/products?new=1" className="studio-float-bar__btn studio-float-bar__btn--lime">
          Add product
        </Link>
      )}
      {capabilities.canEditPromotions && (
        <button
          type="button"
          className="studio-float-bar__btn"
          onClick={() => studioEdit.openPromotionsManager()}
        >
          Promotions
        </button>
      )}
      {capabilities.canEditPromotions && (
        <button
          type="button"
          className="studio-float-bar__btn"
          onClick={() => studioEdit.openEditSpecialOffers()}
        >
          Special offers
        </button>
      )}
      {capabilities.canEditArticles && (
        <button
          type="button"
          className="studio-float-bar__btn"
          onClick={() => studioEdit.openCreateArticle()}
        >
          New article
        </button>
      )}
      {capabilities.canEditBundles && (
        <button
          type="button"
          className="studio-float-bar__btn"
          onClick={() => studioEdit.openCreateBundle()}
        >
          New bundle
        </button>
      )}
      {capabilities.canEditFinancing && (
        <button
          type="button"
          className="studio-float-bar__btn"
          onClick={() => studioEdit.openFinancingOffers()}
        >
          Offers
        </button>
      )}
      {capabilities.canEditDeliveryRates && (
        <button
          type="button"
          className="studio-float-bar__btn"
          onClick={() => studioEdit.openDeliveryRatesManager()}
        >
          Delivery
        </button>
      )}
      {capabilities.canEditReviews && (
        <button
          type="button"
          className="studio-float-bar__btn"
          onClick={() => studioEdit.openReviewsManager()}
        >
          Reviews
        </button>
      )}
    </>
  );
}

export function StudioShell({
  children,
  pathnameHint,
}: {
  children: ReactNode;
  pathnameHint?: string | null;
}) {
  const { loading, isAuthenticated, user, profile, logout, capabilities } =
    useStudioAuth();
  const router = useRouter();
  const pathname = pathnameHint || '';
  const isLogin = pathname === '/studio/login';

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !isLogin) {
      const next = pathnameHint || (typeof window !== 'undefined' ? window.location.pathname : '/studio');
      router.replace(`/studio/login?next=${encodeURIComponent(next || '/studio')}`);
    }
    if (isAuthenticated && isLogin) {
      router.replace('/studio/products');
    }
  }, [loading, isAuthenticated, isLogin, pathnameHint, router]);

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
    <StudioEditHost>
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
            <StudioFloatActions />
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
        <p className="studio-shell__edit-hint" role="note">
          Use the bar for Promotions, Special offers, Articles, Bundles, Offers, Delivery, and
          Reviews. Green Edit buttons still appear on in-page cards.
        </p>
        <div className="studio-mirror-pad">{children}</div>
      </div>
    </StudioEditHost>
  );
}
