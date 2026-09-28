'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { StudioEditDrawer, type StudioEditResource } from '@/components/studio/StudioEditDrawer';
import { useStudioAuthOptional } from '@/components/studio/StudioAuthContext';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import {
  findStudioArticleBySlug,
  retrieveStudioArticle,
  retrieveStudioProduct,
  StudioApiError,
} from '@/lib/studio/api';
import { useStudioLocation } from '@/lib/studio/useStudioLocation';

/** Floating edit control on PDP when browsing under /studio. */
export function StudioPdpEditButton({ productId }: { productId?: number | null }) {
  const { inStudio } = useStudioLocation();
  const studio = useStudioAuthOptional();
  const studioEdit = useStudioEditOptional();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [resource, setResource] = useState<StudioEditResource | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canEdit = Boolean(
    studioEdit ||
      studio?.capabilities.canFullEditProduct ||
      studio?.capabilities.canContentEditProduct
  );
  const show =
    Boolean(studioEdit) ||
    (inStudio && Boolean(studio?.isAuthenticated) && canEdit && Boolean(productId));

  const openEditor = useCallback(async () => {
    if (!productId) return;
    if (studioEdit) {
      await studioEdit.openEditProduct(productId);
      return;
    }
    setError(null);
    try {
      const full = await retrieveStudioProduct(productId);
      setResource({ kind: 'product', mode: 'edit', product: full });
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

  if (!show || !productId) {
    return null;
  }

  const editTitle = `Edit product · ${studio?.capabilities.roleLabel || 'Studio'}`;

  return (
    <>
      <div className="studio-pdp-chrome">
        <button
          type="button"
          className="studio-icon-btn studio-icon-btn--edit"
          title={editTitle}
          aria-label={editTitle}
          onClick={() => void openEditor()}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
          </svg>
          <span>Edit</span>
        </button>
        {error && <span className="studio-pdp-chrome__error">{error}</span>}
      </div>
      {!studioEdit && (
        <StudioEditDrawer
          open={open}
          resource={resource}
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

/** Floating edit control on article/blog pages under /studio. */
export function StudioArticleEditButton({
  articleId,
  articleSlug,
}: {
  articleId?: number | null;
  articleSlug?: string | null;
}) {
  const { inStudio } = useStudioLocation();
  const studio = useStudioAuthOptional();
  const studioEdit = useStudioEditOptional();
  const [error, setError] = useState<string | null>(null);

  const canEdit = Boolean(studioEdit?.capabilities.canEditArticles || studio?.capabilities.canEditArticles);
  const show =
    Boolean(studioEdit?.capabilities.canEditArticles) ||
    (inStudio && Boolean(studio?.isAuthenticated) && canEdit && Boolean(articleId || articleSlug));

  const openEditor = useCallback(async () => {
    setError(null);
    if (studioEdit) {
      await studioEdit.openEditArticle({ id: articleId, slug: articleSlug });
      return;
    }
    try {
      if (articleId) await retrieveStudioArticle(articleId);
      else if (articleSlug) await findStudioArticleBySlug(articleSlug);
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not load article'
      );
    }
  }, [articleId, articleSlug, studioEdit]);

  if (!show || (!articleId && !articleSlug)) {
    return null;
  }

  const editTitle = `Edit article · ${studio?.capabilities.roleLabel || 'Studio'}`;

  return (
    <div className="studio-pdp-chrome">
      <button
        type="button"
        className="studio-icon-btn studio-icon-btn--edit"
        title={editTitle}
        aria-label={editTitle}
        onClick={() => void openEditor()}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
        </svg>
        <span>Edit</span>
      </button>
      {error && <span className="studio-pdp-chrome__error">{error}</span>}
    </div>
  );
}
