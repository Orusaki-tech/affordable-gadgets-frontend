'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import { studioPath } from '@/lib/studio/paths';

type StudioPromoTileProps = {
  promotionId?: number | null;
  title: string;
  /** When omitted, children are wrapped without a link (click handlers stay on children). */
  href?: string | null;
  className?: string;
  children: ReactNode;
};

/** Promo / banner tile with optional Studio edit chrome. */
export function StudioPromoTile({
  promotionId,
  title,
  href,
  className,
  children,
}: StudioPromoTileProps) {
  const studioEdit = useStudioEditOptional();
  const canEdit = Boolean(studioEdit?.capabilities.canEditPromotions && promotionId);

  const content =
    href != null && href !== '' ? (
      <Link href={studioPath(href)} className={className}>
        {children}
      </Link>
    ) : className ? (
      <div className={className}>{children}</div>
    ) : (
      <>{children}</>
    );

  if (!canEdit || !promotionId) {
    return content;
  }

  return (
    <StudioBlockChrome
      label={title}
      roleHint={studioEdit?.capabilities.roleLabel}
      onEdit={() => {
        void studioEdit?.openEditPromotion(promotionId);
      }}
    >
      {content}
    </StudioBlockChrome>
  );
}
