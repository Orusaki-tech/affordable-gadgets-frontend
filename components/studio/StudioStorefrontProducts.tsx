'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { ProductsPage } from '@/components/ProductsPage';
import { StudioEditableCard } from '@/components/studio/StudioEditableCard';
import { StudioEditDrawer } from '@/components/studio/StudioEditDrawer';
import { useStudioAuth } from '@/components/studio/StudioAuthContext';
import {
  deleteStudioProduct,
  retrieveStudioProduct,
  StudioApiError,
  type StudioProduct,
} from '@/lib/studio/api';
import type { PublicProduct } from '@/lib/api/generated';
import { useQueryClient } from '@tanstack/react-query';

function StudioStorefrontProductsInner() {
  const { capabilities, isAuthenticated, loading } = useStudioAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('edit');
  const [editing, setEditing] = useState<StudioProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const openCreate = useCallback(() => {
    setDrawerMode('create');
    setEditing(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback(async (product: PublicProduct) => {
    if (!product.id) return;
    setError(null);
    setDrawerMode('edit');
    setBusyId(product.id);
    try {
      const full = await retrieveStudioProduct(product.id);
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
    } finally {
      setBusyId(null);
    }
  }, []);

  const handleDelete = useCallback(
    async (product: PublicProduct) => {
      if (!product.id || !capabilities.canDelete) return;
      const ok = window.confirm(`Delete “${product.product_name}”?`);
      if (!ok) return;
      setError(null);
      setBusyId(product.id);
      try {
        await deleteStudioProduct(product.id);
        await queryClient.invalidateQueries({ queryKey: ['products'] });
      } catch (err) {
        setError(
          err instanceof StudioApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Delete failed'
        );
      } finally {
        setBusyId(null);
      }
    },
    [capabilities.canDelete, queryClient]
  );

  // Deep-link: /studio/products?edit=123 or ?new=1
  useEffect(() => {
    if (!isAuthenticated || loading) return;
    const editId = searchParams.get('edit');
    const isNew = searchParams.get('new') === '1';
    if (isNew && capabilities.canCreate) {
      openCreate();
      router.replace('/studio/products', { scroll: false });
      return;
    }
    if (editId) {
      const id = Number(editId);
      if (Number.isFinite(id) && id > 0) {
        void openEdit({ id, product_name: '' } as PublicProduct);
        router.replace('/studio/products', { scroll: false });
      }
    }
  }, [
    isAuthenticated,
    loading,
    searchParams,
    capabilities.canCreate,
    openCreate,
    openEdit,
    router,
  ]);

  if (loading || !isAuthenticated) {
    return (
      <div className="studio-shell studio-shell--loading">
        <p>Loading studio…</p>
      </div>
    );
  }

  const canEdit = capabilities.canFullEdit || capabilities.canContentEdit;

  return (
    <div className="min-h-screen flex flex-col studio-mirror">
      <Suspense
        fallback={
          <div className="site-header-wrapper">
            <HeaderWithAnnouncement />
          </div>
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>

      {error && (
        <div className="studio-mirror__toast" role="alert">
          {error}
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {busyId != null && (
        <div className="studio-mirror__busy" aria-live="polite">
          Working…
        </div>
      )}

      <main className="flex-1 pb-8">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-96" />
              ))}
            </div>
          }
        >
          <ProductsPage
            renderProductCard={(product) => (
              <StudioEditableCard
                product={product}
                canEdit={canEdit}
                canDelete={capabilities.canDelete}
                onEdit={(p) => void openEdit(p)}
                onDelete={(p) => void handleDelete(p)}
              />
            )}
          />
        </Suspense>
      </main>

      <Footer />

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
        }}
      />
    </div>
  );
}

export function StudioStorefrontProducts() {
  return (
    <Suspense
      fallback={
        <div className="studio-shell studio-shell--loading">
          <p>Loading studio…</p>
        </div>
      }
    >
      <StudioStorefrontProductsInner />
    </Suspense>
  );
}
