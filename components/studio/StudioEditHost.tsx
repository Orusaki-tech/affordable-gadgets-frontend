'use client';

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  retrieveStudioBundle,
  retrieveStudioDeliveryRate,
  retrieveStudioFinancingProvider,
  retrieveStudioProduct,
  retrieveStudioPromotion,
  StudioApiError,
} from '@/lib/studio/api';
import type { StudioCapabilities } from '@/lib/studio/permissions';
import type { PublicProduct } from '@/lib/api/generated';

type StudioEditHostValue = {
  capabilities: StudioCapabilities;
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
  openEditBundle: (id: number) => Promise<void>;
  openEditFinancingProvider: (id: number) => Promise<void>;
  openEditDeliveryRate: (id: number) => Promise<void>;
  openEditFeaturedProducts: () => void;
  openEditVideoProducts: () => void;
};

const StudioEditContext = createContext<StudioEditHostValue | undefined>(undefined);

export function useStudioEditOptional(): StudioEditHostValue | undefined {
  return useContext(StudioEditContext);
}

/** Deep-link ?new=1 / ?edit=id — isolated so useSearchParams suspense never drops the provider. */
function StudioEditQueryBridge({
  capabilities,
  openCreateProduct,
  openEditProduct,
}: {
  capabilities: StudioCapabilities;
  openCreateProduct: () => void;
  openEditProduct: (id: number) => Promise<void>;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const editId = searchParams.get('edit');
    const isNew = searchParams.get('new') === '1';
    if (!isNew && !editId) return;

    if (isNew && capabilities.canCreateProduct) {
      openCreateProduct();
    } else if (editId) {
      const id = Number(editId);
      if (Number.isFinite(id) && id > 0) {
        void openEditProduct(id);
      }
    }

    const clean =
      typeof window !== 'undefined' && window.location.pathname.startsWith('/studio')
        ? window.location.pathname
        : '/studio/products';
    router.replace(clean, { scroll: false });
  }, [capabilities, searchParams, openCreateProduct, openEditProduct, router]);

  return null;
}

/**
 * Only mounted under StudioShell while authenticated.
 * Always provides edit context — do not gate on usePathname (rewrites lie).
 */
export function StudioEditHost({ children }: { children: ReactNode }) {
  const studio = useStudioAuthOptional();
  const queryClient = useQueryClient();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resource, setResource] = useState<StudioEditResource | null>(null);
  const [error, setError] = useState<string | null>(null);

  const capabilities = studio?.capabilities;
  const isAuthenticated = Boolean(studio?.isAuthenticated);

  const openCreateProduct = useCallback(() => {
    if (!capabilities?.canCreateProduct) {
      setError('Your role cannot create products.');
      return;
    }
    setResource({ kind: 'product', mode: 'create', product: null });
    setDrawerOpen(true);
  }, [capabilities?.canCreateProduct]);

  const openEditProduct = useCallback(
    async (product: Pick<PublicProduct, 'id' | 'product_name'> | number) => {
      if (!capabilities?.canFullEditProduct && !capabilities?.canContentEditProduct) {
        setError('Your role cannot edit products.');
        return;
      }
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
    [capabilities?.canContentEditProduct, capabilities?.canFullEditProduct]
  );

  const deleteProduct = useCallback(
    async (product: Pick<PublicProduct, 'id' | 'product_name'>) => {
      if (!product.id || !capabilities?.canDeleteProduct) return;
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
    [capabilities?.canDeleteProduct, queryClient]
  );

  const openEditArticle = useCallback(
    async (ref: { id?: number | null; slug?: string | null }) => {
      if (!capabilities?.canEditArticles) {
        setError('Your role cannot edit articles.');
        return;
      }
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
    [capabilities?.canEditArticles]
  );

  const openEditPromotion = useCallback(
    async (id: number) => {
      if (!id) return;
      if (!capabilities?.canEditPromotions) {
        setError('Your role cannot edit promotions.');
        return;
      }
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
    },
    [capabilities?.canEditPromotions]
  );

  const openEditBundle = useCallback(
    async (id: number) => {
      if (!id) return;
      if (!capabilities?.canEditBundles) {
        setError('Your role cannot edit bundles (Marketing Manager only).');
        return;
      }
      setError(null);
      try {
        const full = await retrieveStudioBundle(id);
        setResource({ kind: 'bundle', bundle: full });
        setDrawerOpen(true);
      } catch (err) {
        setError(
          err instanceof StudioApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Could not load bundle for editing'
        );
      }
    },
    [capabilities?.canEditBundles]
  );

  const openEditFinancingProvider = useCallback(
    async (id: number) => {
      if (!id) return;
      if (!capabilities?.canEditFinancing) {
        setError('Your role cannot edit financing providers (Inventory Manager only).');
        return;
      }
      setError(null);
      try {
        const full = await retrieveStudioFinancingProvider(id);
        setResource({ kind: 'financingProvider', provider: full });
        setDrawerOpen(true);
      } catch (err) {
        setError(
          err instanceof StudioApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Could not load financing provider'
        );
      }
    },
    [capabilities?.canEditFinancing]
  );

  const openEditDeliveryRate = useCallback(
    async (id: number) => {
      if (!id) return;
      if (!capabilities?.canEditDeliveryRates) {
        setError('Your role cannot edit delivery rates (Order Manager only).');
        return;
      }
      setError(null);
      try {
        const full = await retrieveStudioDeliveryRate(id);
        setResource({ kind: 'deliveryRate', rate: full });
        setDrawerOpen(true);
      } catch (err) {
        setError(
          err instanceof StudioApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Could not load delivery rate'
        );
      }
    },
    [capabilities?.canEditDeliveryRates]
  );

  const openEditFeaturedProducts = useCallback(() => {
    if (!capabilities?.canEditFeaturedSelection) {
      setError('Your role cannot edit featured product highlights.');
      return;
    }
    setError(null);
    setResource({ kind: 'taggedProducts', section: 'featured' });
    setDrawerOpen(true);
  }, [capabilities?.canEditFeaturedSelection]);

  const openEditVideoProducts = useCallback(() => {
    if (!capabilities?.canEditVideoSelection) {
      setError('Your role cannot choose homepage video products.');
      return;
    }
    setError(null);
    setResource({ kind: 'taggedProducts', section: 'video' });
    setDrawerOpen(true);
  }, [capabilities?.canEditVideoSelection]);

  const value = useMemo<StudioEditHostValue | null>(() => {
    if (!capabilities || !isAuthenticated) return null;
    return {
      capabilities,
      canEdit: Boolean(
        capabilities.canFullEditProduct ||
          capabilities.canContentEditProduct ||
          capabilities.canEditFeaturedSelection ||
          capabilities.canEditVideoSelection ||
          capabilities.canEditArticles ||
          capabilities.canEditPromotions ||
          capabilities.canEditBundles ||
          capabilities.canEditFinancing ||
          capabilities.canEditDeliveryRates
      ),
      canDelete: capabilities.canDeleteProduct,
      canCreate: capabilities.canCreateProduct,
      openCreateProduct,
      openEditProduct,
      deleteProduct,
      openEditArticle,
      openEditPromotion,
      openEditBundle,
      openEditFinancingProvider,
      openEditDeliveryRate,
      openEditFeaturedProducts,
      openEditVideoProducts,
    };
  }, [
    capabilities,
    isAuthenticated,
    openCreateProduct,
    openEditProduct,
    deleteProduct,
    openEditArticle,
    openEditPromotion,
    openEditBundle,
    openEditFinancingProvider,
    openEditDeliveryRate,
    openEditFeaturedProducts,
    openEditVideoProducts,
  ]);

  if (!value || !capabilities) {
    return <>{children}</>;
  }

  return (
    <StudioEditContext.Provider value={value}>
      <Suspense fallback={null}>
        <StudioEditQueryBridge
          capabilities={capabilities}
          openCreateProduct={openCreateProduct}
          openEditProduct={openEditProduct}
        />
      </Suspense>
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
        roleHint={capabilities.editableSummary}
        onClose={() => {
          setDrawerOpen(false);
          setResource(null);
        }}
        onSaved={async () => {
          await queryClient.invalidateQueries();
          const path = typeof window !== 'undefined' ? window.location.pathname : '';
          if (
            path.includes('/products/') ||
            path.includes('/blog/') ||
            path.includes('/articles') ||
            path.includes('/financing')
          ) {
            window.location.reload();
          }
        }}
      />
    </StudioEditContext.Provider>
  );
}
