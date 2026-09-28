'use client';

import { useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { StudioEditDrawer } from '@/components/studio/StudioEditDrawer';
import { useStudioAuthOptional } from '@/components/studio/StudioAuthContext';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import {
  retrieveStudioProduct,
  StudioApiError,
  type StudioProduct,
} from '@/lib/studio/api';
import { isStudioBrowserPath } from '@/lib/studio/paths';

/** Floating edit control on PDP when browsing under /studio. */
export function StudioPdpEditButton({ productId }: { productId?: number | null }) {
  const pathname = usePathname();
  const isStudio = isStudioBrowserPath(pathname);
  const studio = useStudioAuthOptional();
  const studioEdit = useStudioEditOptional();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState<StudioProduct | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canEdit = Boolean(
    studio?.capabilities.canFullEdit || studio?.capabilities.canContentEdit
  );

  const openEditor = useCallback(async () => {
    if (!productId) return;
    if (studioEdit) {
      await studioEdit.openEdit(productId);
      return;
    }
    setError(null);
    try {
      const full = await retrieveStudioProduct(productId);
      setProduct(full);
      setOpen(true);
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not load product'
      );
    }
  }, [productId, studioEdit]);

  if (!isStudio || !studio?.isAuthenticated || !canEdit || !productId) {
    return null;
  }

  return (
    <>
      <div className="studio-pdp-chrome">
        <button
          type="button"
          className="studio-icon-btn"
          title="Edit product"
          aria-label="Edit product"
          onClick={() => void openEditor()}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
          </svg>
        </button>
        {error && <span className="studio-pdp-chrome__error">{error}</span>}
      </div>
      {!studioEdit && (
        <StudioEditDrawer
          open={open}
          mode="edit"
          product={product}
          onClose={() => setOpen(false)}
          onSaved={async () => {
            await queryClient.invalidateQueries({ queryKey: ['product'] });
            await queryClient.invalidateQueries({ queryKey: ['products'] });
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
