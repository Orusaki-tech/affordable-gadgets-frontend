'use client';

import Link from 'next/link';
import { StudioProductEditor } from '@/components/studio/StudioProductEditor';
import { useStudioAuth } from '@/components/studio/StudioAuthContext';

export default function StudioNewProductPage() {
  const { isAuthenticated, loading, capabilities } = useStudioAuth();
  if (loading || !isAuthenticated) {
    return <p className="studio-sub">Loading…</p>;
  }

  return (
    <div className="studio-detail">
      <div className="studio-detail__toolbar">
        <Link href="/studio/products" className="studio-btn studio-btn--ghost">
          ← Products
        </Link>
      </div>
      <p className="studio-eyebrow">Create</p>
      <h1 className="studio-title">Add product</h1>
      <p className="studio-sub" style={{ marginBottom: '1.25rem' }}>
        Creates a catalog template. Units and stock still live in the ops admin.
      </p>
      {capabilities.canCreate ? (
        <StudioProductEditor mode="create" />
      ) : (
        <div className="studio-alert" role="status">
          Your role cannot create products.
        </div>
      )}
    </div>
  );
}
