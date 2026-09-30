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
  openCreateArticle: () => void;
  openEditPromotion: (id: number) => Promise<void>;
  openCreatePromotion: (opts?: {
    title?: string;
    description?: string;
    display_locations?: string[];
    forceLocations?: string[];
    lockLocations?: boolean;
  }) => void;
  openPromotionsManager: () => void;
  openEditHomepageHero: (preferPromotionId?: number | null) => void;
  openEditBundle: (id: number) => Promise<void>;
  openCreateBundle: () => void;
  openEditFinancingProvider: (id: number) => Promise<void>;
  openFinancingOffers: (preferProviderId?: number | null) => void;
  openEditDeliveryRate: (id: number) => Promise<void>;
  openDeliveryRatesManager: () => void;
  openCreateDeliveryRate: () => void;
  openReviewsManager: (preferProductId?: number | null) => void;
  openEditFeaturedProducts: () => void;
  openEditVideoProducts: () => void;
  openEditFeaturedArticles: () => void;
  openEditBrandBanner: (brandFilter: string) => void;
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
  const [refreshOnClose, setRefreshOnClose] = useState(false);

  const capabilities = studio?.capabilities;
  const isAuthenticated = Boolean(studio?.isAuthenticated);

  const closeDrawer = useCallback(() => {
    const shouldRefresh = refreshOnClose;
    setDrawerOpen(false);
    setResource(null);
    setRefreshOnClose(false);
    if (shouldRefresh && typeof window !== 'undefined') {
      void queryClient.invalidateQueries();
      window.location.reload();
    }
  }, [queryClient, refreshOnClose]);

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
      const ok = window.confirm(
        `Permanently delete “${product.product_name}”? This cannot be undone. To remove it from Featured/Videos, use Choose products instead.`
      );
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
        setResource({ kind: 'article', mode: 'edit', article: full });
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

  const openCreateArticle = useCallback(() => {
    if (!capabilities?.canEditArticles) {
      setError('Your role cannot edit articles.');
      return;
    }
    setError(null);
    setResource({ kind: 'article', mode: 'create', article: null });
    setDrawerOpen(true);
  }, [capabilities?.canEditArticles]);

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
        setResource({ kind: 'promotion', mode: 'edit', promotion: full });
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

  const openCreatePromotion = useCallback(
    (opts?: {
      title?: string;
      description?: string;
      display_locations?: string[];
      forceLocations?: string[];
      lockLocations?: boolean;
    }) => {
      if (!capabilities?.canEditPromotions) {
        setError('Your role cannot edit promotions.');
        return;
      }
      setError(null);
      const start = new Date();
      const end = new Date();
      end.setFullYear(end.getFullYear() + 2);
      setResource({
        kind: 'promotion',
        mode: 'create',
        promotion: null,
        defaults: {
          title: opts?.title,
          description: opts?.description,
          display_locations: opts?.display_locations ?? opts?.forceLocations,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        },
        forceLocations: opts?.forceLocations,
        lockLocations: opts?.lockLocations,
      });
      setDrawerOpen(true);
    },
    [capabilities?.canEditPromotions]
  );

  const openPromotionsManager = useCallback(() => {
    if (!capabilities?.canEditPromotions) {
      setError('Your role cannot edit promotions.');
      return;
    }
    setError(null);
    setResource({ kind: 'promotionsManager' });
    setDrawerOpen(true);
  }, [capabilities?.canEditPromotions]);

  const openEditHomepageHero = useCallback(
    (preferPromotionId?: number | null) => {
      if (!capabilities?.canEditPromotions) {
        setError('Your role cannot edit promotions.');
        return;
      }
      setError(null);
      setResource({
        kind: 'homepageHero',
        preferPromotionId:
          typeof preferPromotionId === 'number' ? preferPromotionId : null,
      });
      setDrawerOpen(true);
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
        setResource({ kind: 'bundle', mode: 'edit', bundle: full });
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

  const openCreateBundle = useCallback(() => {
    if (!capabilities?.canEditBundles) {
      setError('Your role cannot edit bundles (Marketing Manager only).');
      return;
    }
    setError(null);
    setResource({ kind: 'bundle', mode: 'create', bundle: null });
    setDrawerOpen(true);
  }, [capabilities?.canEditBundles]);

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

  const openFinancingOffers = useCallback(
    (preferProviderId?: number | null) => {
      if (!capabilities?.canEditFinancing) {
        setError('Your role cannot edit financing offers.');
        return;
      }
      setError(null);
      setResource({
        kind: 'financingOffers',
        preferProviderId: typeof preferProviderId === 'number' ? preferProviderId : null,
      });
      setDrawerOpen(true);
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
        setResource({ kind: 'deliveryRate', mode: 'edit', rate: full });
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

  const openDeliveryRatesManager = useCallback(() => {
    if (!capabilities?.canEditDeliveryRates) {
      setError('Your role cannot edit delivery rates (Order Manager only).');
      return;
    }
    setError(null);
    setResource({ kind: 'deliveryRate', mode: 'manage', rate: null });
    setDrawerOpen(true);
  }, [capabilities?.canEditDeliveryRates]);

  const openCreateDeliveryRate = useCallback(() => {
    if (!capabilities?.canEditDeliveryRates) {
      setError('Your role cannot edit delivery rates (Order Manager only).');
      return;
    }
    setError(null);
    setResource({ kind: 'deliveryRate', mode: 'create', rate: null });
    setDrawerOpen(true);
  }, [capabilities?.canEditDeliveryRates]);

  const openReviewsManager = useCallback(
    (preferProductId?: number | null) => {
      if (!capabilities?.canEditReviews) {
        setError('Your role cannot moderate reviews.');
        return;
      }
      setError(null);
      setResource({
        kind: 'reviewsManager',
        preferProductId: typeof preferProductId === 'number' ? preferProductId : null,
      });
      setDrawerOpen(true);
    },
    [capabilities?.canEditReviews]
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

  const openEditFeaturedArticles = useCallback(() => {
    if (!capabilities?.canEditArticles) {
      setError('Your role cannot choose homepage buying guides.');
      return;
    }
    setError(null);
    setResource({ kind: 'taggedArticles' });
    setDrawerOpen(true);
  }, [capabilities?.canEditArticles]);

  const openEditBrandBanner = useCallback(
    (brandFilter: string) => {
      if (!capabilities?.canEditPromotions) {
        setError('Your role cannot edit brand banners (Marketing / Content).');
        return;
      }
      const brand = brandFilter.trim();
      if (!brand) {
        setError('Missing brand filter for banner edit.');
        return;
      }
      setError(null);
      setResource({ kind: 'brandBanner', brandFilter: brand });
      setDrawerOpen(true);
    },
    [capabilities?.canEditPromotions]
  );

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
          capabilities.canEditDeliveryRates ||
          capabilities.canEditReviews
      ),
      canDelete: capabilities.canDeleteProduct,
      canCreate: capabilities.canCreateProduct,
      openCreateProduct,
      openEditProduct,
      deleteProduct,
      openEditArticle,
      openCreateArticle,
      openEditPromotion,
      openCreatePromotion,
      openPromotionsManager,
      openEditHomepageHero,
      openEditBundle,
      openCreateBundle,
      openEditFinancingProvider,
      openFinancingOffers,
      openEditDeliveryRate,
      openDeliveryRatesManager,
      openCreateDeliveryRate,
      openReviewsManager,
      openEditFeaturedProducts,
      openEditVideoProducts,
      openEditFeaturedArticles,
      openEditBrandBanner,
    };
  }, [
    capabilities,
    isAuthenticated,
    openCreateProduct,
    openEditProduct,
    deleteProduct,
    openEditArticle,
    openCreateArticle,
    openEditPromotion,
    openCreatePromotion,
    openPromotionsManager,
    openEditHomepageHero,
    openEditBundle,
    openCreateBundle,
    openEditFinancingProvider,
    openFinancingOffers,
    openEditDeliveryRate,
    openDeliveryRatesManager,
    openCreateDeliveryRate,
    openReviewsManager,
    openEditFeaturedProducts,
    openEditVideoProducts,
    openEditFeaturedArticles,
    openEditBrandBanner,
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
        roleHint={capabilities.roleLabel}
        onClose={closeDrawer}
        onSaved={async () => {
          const kind = resource?.kind;
          const keepOpen =
            kind === 'taggedProducts' ||
            kind === 'taggedArticles' ||
            kind === 'featuredProducts' ||
            kind === 'brandBanner' ||
            kind === 'homepageHero' ||
            kind === 'promotionsManager' ||
            kind === 'financingOffers' ||
            kind === 'reviewsManager' ||
            (kind === 'deliveryRate' && resource?.mode === 'manage') ||
            // Create→edit handoff: drawer stays open; defer reload until close.
            (kind === 'product' && resource?.mode === 'create') ||
            (kind === 'bundle' && resource?.mode === 'create') ||
            (kind === 'article' && resource?.mode === 'create');

          await queryClient.invalidateQueries({ queryKey: ['products'] });
          await queryClient.invalidateQueries({ queryKey: ['articles'] });
          await queryClient.invalidateQueries({ queryKey: ['promotions'] });
          await queryClient.invalidateQueries({ queryKey: ['bundles'] });
          await queryClient.invalidateQueries({ queryKey: ['delivery-rates'] });
          await queryClient.invalidateQueries({ queryKey: ['reviews'] });
          await queryClient.invalidateQueries({ queryKey: ['financing-providers'] });
          await queryClient.refetchQueries({ queryKey: ['products', 'featured'] });
          await queryClient.refetchQueries({ queryKey: ['articles', 'featured'] });
          await queryClient.refetchQueries({ queryKey: ['promotions'] });
          if (keepOpen) {
            setRefreshOnClose(true);
            return;
          }
          const path = typeof window !== 'undefined' ? window.location.pathname : '';
          const isStudioHome = path === '/studio' || path === '/studio/';
          if (
            isStudioHome ||
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
