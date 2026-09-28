'use client';

import { useEffect } from 'react';
import { StudioProductEditor } from '@/components/studio/StudioProductEditor';
import type { StudioProduct } from '@/lib/studio/api';

type StudioEditDrawerProps = {
  open: boolean;
  mode: 'create' | 'edit';
  product?: StudioProduct | null;
  onClose: () => void;
  onSaved: (product: StudioProduct) => void;
};

export function StudioEditDrawer({
  open,
  mode,
  product,
  onClose,
  onSaved,
}: StudioEditDrawerProps) {
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

  if (!open) return null;

  return (
    <div className="studio-drawer" role="dialog" aria-modal="true" aria-label="Edit product">
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
        <StudioProductEditor
          mode={mode}
          product={product}
          onSaved={(saved) => {
            onSaved(saved);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
