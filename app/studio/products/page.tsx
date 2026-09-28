'use client';

import { StudioProductGrid } from '@/components/studio/StudioProductGrid';
import { useStudioAuth } from '@/components/studio/StudioAuthContext';

export default function StudioProductsPage() {
  const { isAuthenticated, loading } = useStudioAuth();
  if (loading || !isAuthenticated) {
    return <p className="studio-sub">Loading…</p>;
  }
  return <StudioProductGrid />;
}
