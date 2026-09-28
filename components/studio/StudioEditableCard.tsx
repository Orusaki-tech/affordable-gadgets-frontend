'use client';

import type { PublicProduct } from '@/lib/api/generated';
import { ProductCard } from '@/components/ProductCard';

type StudioEditableCardProps = {
  product: PublicProduct;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (product: PublicProduct) => void;
  onDelete: (product: PublicProduct) => void;
};

export function StudioEditableCard({
  product,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: StudioEditableCardProps) {
  return (
    <div className="studio-editable-card">
      {(canEdit || canDelete) && (
        <div className="studio-editable-card__chrome" aria-label="Studio actions">
          {canEdit && (
            <button
              type="button"
              className="studio-icon-btn"
              title="Edit in place"
              aria-label={`Edit ${product.product_name}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(product);
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
              </svg>
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className="studio-icon-btn studio-icon-btn--danger"
              title="Delete product"
              aria-label={`Delete ${product.product_name}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(product);
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            </button>
          )}
        </div>
      )}
      <ProductCard product={product} />
    </div>
  );
}
