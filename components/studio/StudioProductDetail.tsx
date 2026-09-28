'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { StudioProductEditor } from '@/components/studio/StudioProductEditor';
import { useStudioAuth } from '@/components/studio/StudioAuthContext';
import {
  deleteStudioProduct,
  retrieveStudioProduct,
  studioProductImageUrl,
  StudioApiError,
  type StudioProduct,
} from '@/lib/studio/api';
import { formatPrice } from '@/lib/utils/format';
import { useRouter } from 'next/navigation';

export function StudioProductDetail({ productId }: { productId: number }) {
  const { capabilities } = useStudioAuth();
  const router = useRouter();
  const [product, setProduct] = useState<StudioProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await retrieveStudioProduct(productId);
      setProduct(data);
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load product'
      );
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async () => {
    if (!product || !capabilities.canDelete) return;
    const ok = window.confirm(`Delete “${product.product_name}”?`);
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteStudioProduct(product.id);
      router.replace('/studio/products');
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Delete failed'
      );
      setDeleting(false);
    }
  };

  if (loading) {
    return <p className="studio-sub">Loading product…</p>;
  }

  if (error && !product) {
    return (
      <div className="studio-alert" role="alert">
        {error}
      </div>
    );
  }

  if (!product) return null;

  const imageUrl = studioProductImageUrl(product);
  const price = product.default_selling_price
    ? formatPrice(Number(product.default_selling_price))
    : null;

  return (
    <div className="studio-detail">
      <div className="studio-detail__toolbar">
        <Link href="/studio/products" className="studio-btn studio-btn--ghost">
          ← Products
        </Link>
        <div className="studio-detail__toolbar-actions">
          {product.slug && (
            <a
              href={`/products/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="studio-btn studio-btn--ghost"
            >
              Open shop PDP
            </a>
          )}
          {capabilities.canDelete && (
            <button
              type="button"
              className="studio-btn studio-btn--danger"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="studio-alert" role="alert">
          {error}
        </div>
      )}

      <div className="studio-detail__layout">
        <section className="studio-detail__preview" aria-label="Storefront-style preview">
          <p className="studio-eyebrow">Storefront preview</p>
          <div className="studio-detail__preview-card">
            <div className="studio-detail__preview-media">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={product.product_name}
                  fill
                  className="studio-detail__preview-image"
                  sizes="(max-width: 900px) 100vw, 420px"
                  unoptimized
                />
              ) : (
                <div className="studio-card__image-fallback" aria-hidden />
              )}
            </div>
            <div className="studio-detail__preview-body">
              <p className="studio-card__brand">
                {product.brand || '—'} · {product.product_type_display || product.product_type}
              </p>
              <h1 className="studio-detail__preview-name">{product.product_name}</h1>
              {price && <p className="studio-detail__preview-price">{price}</p>}
              <p className="studio-detail__preview-desc">
                {product.product_description ||
                  product.long_description ||
                  'No description yet.'}
              </p>
              <ul className="studio-detail__facts">
                <li>
                  Status:{' '}
                  <strong>
                    {product.is_published ? 'Published' : 'Draft'}
                    {product.is_discontinued ? ' · Discontinued' : ''}
                  </strong>
                </li>
                <li>
                  Stock: <strong>{product.available_stock ?? '—'}</strong>
                </li>
                <li>
                  Slug: <strong>{product.slug || '—'}</strong>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <aside className="studio-detail__editor-pane">
          <StudioProductEditor
            mode="edit"
            product={product}
            onSaved={(saved) => setProduct(saved)}
          />
        </aside>
      </div>
    </div>
  );
}
