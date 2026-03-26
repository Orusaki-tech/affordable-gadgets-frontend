'use client';

import { useEffect } from 'react';
import type { PromotionVideoProduct } from '@/components/ProductVideoReel';
import { ProductVideoReel } from '@/components/ProductVideoReel';

export function PromotionVideosDrawer({
  open,
  title,
  subtitle,
  products,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string | null;
  products: PromotionVideoProduct[];
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="promo-videos-drawer" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="promo-videos-drawer__backdrop" onClick={onClose} aria-label="Close" />
      <aside className="promo-videos-drawer__panel">
        <div className="promo-videos-drawer__header">
          <div className="promo-videos-drawer__titles">
            <p className="promo-videos-drawer__kicker">Offer videos</p>
            <h2 className="promo-videos-drawer__title">{title}</h2>
            {subtitle ? <p className="promo-videos-drawer__subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="promo-videos-drawer__close" onClick={onClose} aria-label="Close">
            <svg className="promo-videos-drawer__close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="promo-videos-drawer__body">
          <ProductVideoReel products={products} deckKey="promo-videos" />
        </div>
      </aside>
    </div>
  );
}

