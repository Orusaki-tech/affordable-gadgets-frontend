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
import { StudioEditDrawer } from '@/components/studio/StudioEditDrawer';
import { useStudioAuthOptional } from '@/components/studio/StudioAuthContext';
import {
  deleteStudioProduct,
  retrieveStudioProduct,
  StudioApiError,
  type StudioProduct,
} from '@/lib/studio/api';
import { isStudioBrowserPath } from '@/lib/studio/paths';
import type { PublicProduct } from '@/lib/api/generated';

type StudioEditHostValue = {
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
  openCreate: () => void;
  openEdit: (product: Pick<PublicProduct, 'id' | 'product_name'> | number) => Promise<void>;
  deleteProduct: (product: Pick<PublicProduct, 'id' | 'product_name'>) => Promise<void>;
};

const StudioEditContext = createContext<StudioEditHostValue | undefined>(undefined);

export function useStudioEditOptional(): StudioEditHostValue | undefined {
  return useContext(StudioEditContext);
}

/**
 * Global in-place product editor for the mirrored storefront under /studio.
 * Mounted once in StudioShell so every page (home, catalog, PDP cards, etc.) can edit.
 */
export function StudioEditHost({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isStudio = isStudioBrowserPath(pathname);
  const studio = useStudioAuthOptional();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('edit');
  const [editing, setEditing] = useState<StudioProduct | null>(null);
  const [error, setError] = useState<string | null>(null);

  const capabilities = studio?.capabilities;
  const isAuthenticated = Boolean(studio?.isAuthenticated);
  const active = Boolean(isStudio && isAuthenticated && capabilities);

  const canEdit = Boolean(capabilities?.canFullEdit || capabilities?.canContentEdit);
  const canDelete = Boolean(capabilities?.canDelete);
  const canCreate = Boolean(capabilities?.canCreate);

  const openCreate = useCallback(() => {
    setDrawerMode('create');
    setEditing(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback(
    async (product: Pick<PublicProduct, 'id' | 'product_name'> | number) => {
      const id = typeof product === 'number' ? product : product.id;
      if (!id) return;
      setError(null);
      setDrawerMode('edit');
      try {
        const full = await retrieveStudioProduct(id);
        setEditing(full);
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

  // Deep-link: /studio/products?new=1 or ?edit=<id>
  useEffect(() => {
    if (!active || !capabilities) return;
    const editId = searchParams.get('edit');
    const isNew = searchParams.get('new') === '1';
    if (!isNew && !editId) return;

    if (isNew && capabilities.canCreate) {
      openCreate();
    } else if (editId) {
      const id = Number(editId);
      if (Number.isFinite(id) && id > 0) {
        void openEdit(id);
      }
    }

    const clean = pathname?.startsWith('/studio') ? pathname : '/studio/products';
    router.replace(clean, { scroll: false });
  }, [active, capabilities, searchParams, openCreate, openEdit, router, pathname]);

  const value = useMemo<StudioEditHostValue>(
    () => ({
      canEdit,
      canDelete,
      canCreate,
      openCreate,
      openEdit,
      deleteProduct,
    }),
    [canEdit, canDelete, canCreate, openCreate, openEdit, deleteProduct]
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
        mode={drawerMode}
        product={editing}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSaved={async () => {
          await queryClient.invalidateQueries({ queryKey: ['products'] });
          await queryClient.invalidateQueries({ queryKey: ['product'] });
          // PDP data is often cached outside list queries — refresh the live page.
          if (pathname?.includes('/products/')) {
            window.location.reload();
          }
        }}
      />
    </StudioEditContext.Provider>
  );
}
