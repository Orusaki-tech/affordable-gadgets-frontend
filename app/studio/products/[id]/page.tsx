'use client';

import { use } from 'react';
import { StudioProductDetail } from '@/components/studio/StudioProductDetail';
import { useStudioAuth } from '@/components/studio/StudioAuthContext';

export default function StudioProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isAuthenticated, loading } = useStudioAuth();
  const productId = Number(id);

  if (loading || !isAuthenticated) {
    return <p className="studio-sub">Loading…</p>;
  }

  if (!Number.isFinite(productId) || productId <= 0) {
    return (
      <div className="studio-alert" role="alert">
        Invalid product id.
      </div>
    );
  }

  return <StudioProductDetail productId={productId} />;
}
