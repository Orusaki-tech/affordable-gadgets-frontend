'use client';

import { useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
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
import { isStudioBrowserPath } from '@/lib/studio/paths';

/** Floating edit control on PDP when browsing under /studio. */
export function StudioPdpEditButton({ productId }: { productId?: number | null }) {
  const pathname = usePathname();
  const isStudio = isStudioBrowserPath(pathname);
  const studio = useStudioAuthOptional();
  const studioEdit = useStudioEditOptional();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [resource, setResource] = useState<StudioEditResource | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canEdit = Boolean(
    studio?.capabilities.canFullEditProduct || studio?.capabilities.canContentEditProduct
  );

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

  if (!isStudio || !studio?.isAuthenticated || !canEdit || !productId) {
    return null;
  }

  const editTitle = `Edit product · ${studio.capabilities.roleLabel}`;

  return (
    <>
      <div className="studio-pdp-chrome">
        <button
          type="button"
          className="studio-icon-btn"
          title={editTitle}
          aria-label={editTitle}
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
  const pathname = usePathname();
  const isStudio = isStudioBrowserPath(pathname);
  const studio = useStudioAuthOptional();
  const studioEdit = useStudioEditOptional();
  const [error, setError] = useState<string | null>(null);

  const canEdit = Boolean(studio?.capabilities.canEditArticles);

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

  if (!isStudio || !studio?.isAuthenticated || !canEdit || (!articleId && !articleSlug)) {
    return null;
  }

  const editTitle = `Edit article · ${studio.capabilities.roleLabel}`;

  return (
    <div className="studio-pdp-chrome">
      <button
        type="button"
        className="studio-icon-btn"
        title={editTitle}
        aria-label={editTitle}
        onClick={() => void openEditor()}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
        </svg>
      </button>
      {error && <span className="studio-pdp-chrome__error">{error}</span>}
    </div>
  );
}
