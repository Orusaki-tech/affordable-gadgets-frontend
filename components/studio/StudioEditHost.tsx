'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  StudioEditDrawer,
  type StudioEditResource,
} from '@/components/studio/StudioEditDrawer';
import { useStudioAuthOptional } from '@/components/studio/StudioAuthContext';
import {
  deleteStudioProduct,
  findStudioArticleBySlug,
  retrieveStudioArticle,
  retrieveStudioProduct,
  retrieveStudioPromotion,
  StudioApiError,
} from '@/lib/studio/api';
import { isStudioBrowserPath } from '@/lib/studio/paths';
import type { PublicProduct } from '@/lib/api/generated';

type StudioEditHostValue = {
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
  openCreateProduct: () => void;
  openEditProduct: (
    product: Pick<PublicProduct, 'id' | 'product_name'> | number
  ) => Promise<void>;
  deleteProduct: (product: Pick<PublicProduct, 'id' | 'product_name'>) => Promise<void>;
  openEditArticle: (ref: { id?: number | null; slug?: string | null }) => Promise<void>;
  openEditPromotion: (id: number) => Promise<void>;
};

const StudioEditContext = createContext<StudioEditHostValue | undefined>(undefined);

export function useStudioEditOptional(): StudioEditHostValue | undefined {
  return useContext(StudioEditContext);
}

/**
 * Global in-place editors for the mirrored storefront under /studio.
 * Products, articles, and promotions share one drawer host.
 */
export function StudioEditHost({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isStudio = isStudioBrowserPath(pathname);
  const studio = useStudioAuthOptional();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resource, setResource] = useState<StudioEditResource | null>(null);
  const [error, setError] = useState<string | null>(null);

  const capabilities = studio?.capabilities;
  const isAuthenticated = Boolean(studio?.isAuthenticated);
  const active = Boolean(isStudio && isAuthenticated && capabilities);

  const canEdit = Boolean(capabilities?.canFullEdit || capabilities?.canContentEdit);
  const canDelete = Boolean(capabilities?.canDelete);
  const canCreate = Boolean(capabilities?.canCreate);

  const openCreateProduct = useCallback(() => {
    setResource({ kind: 'product', mode: 'create', product: null });
    setDrawerOpen(true);
  }, []);

  const openEditProduct = useCallback(
    async (product: Pick<PublicProduct, 'id' | 'product_name'> | number) => {
      const id = typeof product === 'number' ? product : product.id;
      if (!id) return;
      setError(null);
      try {
        const full = await retrieveStudioProduct(id);
        setResource({ kind: 'product', mode: 'edit', product: full });
        setDrawerOpen(true);
      } catch (err) {
        setError(
          err instanceof StudioApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Could not load product for editing'
        );
      }
    },
    []
  );

  const deleteProduct = useCallback(
    async (product: Pick<PublicProduct, 'id' | 'product_name'>) => {
      if (!product.id || !canDelete) return;
      const ok = window.confirm(`Delete “${product.product_name}”?`);
      if (!ok) return;
      setError(null);
      try {
        await deleteStudioProduct(product.id);
        await queryClient.invalidateQueries({ queryKey: ['products'] });
        await queryClient.invalidateQueries({ queryKey: ['product'] });
      } catch (err) {
        setError(
          err instanceof StudioApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Delete failed'
        );
      }
    },
    [canDelete, queryClient]
  );

  const openEditArticle = useCallback(
    async (ref: { id?: number | null; slug?: string | null }) => {
      setError(null);
      try {
        const full =
          ref.id != null
            ? await retrieveStudioArticle(ref.id)
            : ref.slug
              ? await findStudioArticleBySlug(ref.slug)
              : null;
        if (!full) {
          setError('Could not find article for editing');
          return;
        }
        setResource({ kind: 'article', article: full });
        setDrawerOpen(true);
      } catch (err) {
        setError(
          err instanceof StudioApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Could not load article for editing'
        );
      }
    },
    []
  );

  const openEditPromotion = useCallback(async (id: number) => {
    if (!id) return;
    setError(null);
    try {
      const full = await retrieveStudioPromotion(id);
      setResource({ kind: 'promotion', promotion: full });
      setDrawerOpen(true);
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not load promotion for editing'
      );
    }
  }, []);

  // Deep-link: /studio/products?new=1 or ?edit=<id>
  useEffect(() => {
    if (!active || !capabilities) return;
    const editId = searchParams.get('edit');
    const isNew = searchParams.get('new') === '1';
    if (!isNew && !editId) return;

    if (isNew && capabilities.canCreate) {
      openCreateProduct();
    } else if (editId) {
      const id = Number(editId);
      if (Number.isFinite(id) && id > 0) {
        void openEditProduct(id);
      }
    }

    const clean = pathname?.startsWith('/studio') ? pathname : '/studio/products';
    router.replace(clean, { scroll: false });
  }, [
    active,
    capabilities,
    searchParams,
    openCreateProduct,
    openEditProduct,
    router,
    pathname,
  ]);

  const value = useMemo<StudioEditHostValue>(
    () => ({
      canEdit,
      canDelete,
      canCreate,
      openCreateProduct,
      openEditProduct,
      deleteProduct,
      openEditArticle,
      openEditPromotion,
    }),
    [
      canEdit,
      canDelete,
      canCreate,
      openCreateProduct,
      openEditProduct,
      deleteProduct,
      openEditArticle,
      openEditPromotion,
    ]
  );

  if (!active) {
    return <>{children}</>;
  }

  return (
    <StudioEditContext.Provider value={value}>
      {error && (
        <div className="studio-mirror__toast" role="alert">
          {error}
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      {children}
      <StudioEditDrawer
        open={drawerOpen}
        resource={resource}
        onClose={() => {
          setDrawerOpen(false);
          setResource(null);
        }}
        onSaved={async () => {
          await queryClient.invalidateQueries({ queryKey: ['products'] });
          await queryClient.invalidateQueries({ queryKey: ['product'] });
          if (pathname?.includes('/products/') || pathname?.includes('/blog/') || pathname?.includes('/articles')) {
            window.location.reload();
          }
        }}
      />
    </StudioEditContext.Provider>
  );
}
