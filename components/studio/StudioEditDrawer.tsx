'use client';

import { useEffect } from 'react';
import { StudioProductEditor } from '@/components/studio/StudioProductEditor';
import { StudioArticleEditor } from '@/components/studio/StudioArticleEditor';
import { StudioPromotionEditor } from '@/components/studio/StudioPromotionEditor';
import type { StudioArticle, StudioProduct, StudioPromotion } from '@/lib/studio/api';

export type StudioEditResource =
  | { kind: 'product'; mode: 'create' | 'edit'; product?: StudioProduct | null }
  | { kind: 'article'; article: StudioArticle }
  | { kind: 'promotion'; promotion: StudioPromotion };

type StudioEditDrawerProps = {
  open: boolean;
  resource: StudioEditResource | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export function StudioEditDrawer({ open, resource, onClose, onSaved }: StudioEditDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || !resource) return null;

  const label =
    resource.kind === 'product'
      ? resource.mode === 'create'
        ? 'New product'
        : 'Edit product'
      : resource.kind === 'article'
        ? 'Edit article'
        : 'Edit promotion';

  return (
    <div className="studio-drawer" role="dialog" aria-modal="true" aria-label={label}>
      <button type="button" className="studio-drawer__backdrop" aria-label="Close" onClick={onClose} />
      <div className="studio-drawer__panel">
        <div className="studio-drawer__top">
          <p className="studio-drawer__eyebrow">In-place edit</p>
          <button type="button" className="studio-icon-btn" onClick={onClose} aria-label="Close editor">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor">
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        {resource.kind === 'product' && (
          <StudioProductEditor
            mode={resource.mode}
            product={resource.product}
            onSaved={async () => {
              await onSaved();
              onClose();
            }}
          />
        )}
        {resource.kind === 'article' && (
          <StudioArticleEditor
            article={resource.article}
            onSaved={async () => {
              await onSaved();
              onClose();
            }}
          />
        )}
        {resource.kind === 'promotion' && (
          <StudioPromotionEditor
            promotion={resource.promotion}
            onSaved={async () => {
              await onSaved();
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}
