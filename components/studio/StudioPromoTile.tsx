'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import { studioPath } from '@/lib/studio/paths';

type StudioPromoTileProps = {
  promotionId?: number | null;
  title: string;
  href: string;
  className?: string;
  children: ReactNode;
};

/** Promo tile with optional Studio edit chrome. */
export function StudioPromoTile({
  promotionId,
  title,
  href,
  className,
  children,
}: StudioPromoTileProps) {
  const studioEdit = useStudioEditOptional();
  const canEdit = Boolean(studioEdit?.capabilities.canEditPromotions && promotionId);

  const link = (
    <Link href={studioPath(href)} className={className}>
      {children}
    </Link>
  );

  if (!canEdit || !promotionId) {
    return link;
  }

  return (
    <StudioBlockChrome
      label={title}
      roleHint={studioEdit?.capabilities.roleLabel}
      onEdit={() => {
        void studioEdit?.openEditPromotion(promotionId);
      }}
    >
      {link}
    </StudioBlockChrome>
  );
}
