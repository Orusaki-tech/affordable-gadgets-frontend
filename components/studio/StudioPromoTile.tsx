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
  /** Optional one-click remove (e.g. from Special Offers). */
  onRemove?: () => void;
};

/** Promo / banner tile with optional Studio edit chrome. */
export function StudioPromoTile({
  promotionId,
  title,
  href,
  className,
  children,
  onRemove,
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
    <div className="studio-editable-card">
      <div className="studio-editable-card__chrome" aria-label="Studio actions">
        <button
          type="button"
          className="studio-icon-btn studio-icon-btn--edit"
          title={`Edit ${title} · ${studioEdit?.capabilities.roleLabel || 'Studio'}`}
          aria-label={`Edit ${title}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void studioEdit?.openEditPromotion(promotionId);
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
          </svg>
          <span>Edit</span>
        </button>
        {onRemove ? (
          <button
            type="button"
            className="studio-icon-btn studio-icon-btn--danger"
            title={`Remove ${title} from this section`}
            aria-label={`Remove ${title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
          >
            <span>Remove</span>
          </button>
        ) : null}
      </div>
      {content}
    </div>
  );
}
