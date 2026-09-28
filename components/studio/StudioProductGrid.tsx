'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useStudioAuth } from '@/components/studio/StudioAuthContext';
import {
  deleteStudioProduct,
  listStudioProducts,
  studioProductImageUrl,
  StudioApiError,
  type StudioProduct,
} from '@/lib/studio/api';
import { formatPrice } from '@/lib/utils/format';

export function StudioProductGrid() {
  const { capabilities } = useStudioAuth();
  const [products, setProducts] = useState<StudioProduct[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listStudioProducts({ page, search: query || undefined });
      setProducts(data.results || []);
      setCount(data.count || 0);
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load products'
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  const handleDelete = async (product: StudioProduct) => {
    if (!capabilities.canDelete) return;
    const ok = window.confirm(
      `Delete “${product.product_name}”? This cannot be undone from Studio.`
    );
    if (!ok) return;
    setDeletingId(product.id);
    setError(null);
    try {
      await deleteStudioProduct(product.id);
      await load();
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Delete failed'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="studio-products">
      <div className="studio-products__header">
        <div>
          <p className="studio-eyebrow">Catalog</p>
          <h1 className="studio-title">Products</h1>
          <p className="studio-sub">
            Same visual language as the shop. Edit here, customers see it on the storefront.
          </p>
        </div>
        {capabilities.canCreate && (
          <Link href="/studio/products/new" className="studio-btn studio-btn--lime">
            Add product
          </Link>
        )}
      </div>

      <form className="studio-products__search" onSubmit={handleSearch}>
        <input
          type="search"
          placeholder="Search name, brand, model…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="studio-input"
        />
        <button type="submit" className="studio-btn studio-btn--primary">
          Search
        </button>
      </form>

      {error && (
        <div className="studio-alert" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="studio-products__grid studio-products__grid--loading">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="studio-card studio-card--skeleton" aria-hidden />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="studio-empty">No products found.</p>
      ) : (
        <div className="studio-products__grid">
          {products.map((product) => {
            const imageUrl = studioProductImageUrl(product);
            const price = product.default_selling_price
              ? formatPrice(Number(product.default_selling_price))
              : null;
            return (
              <article key={product.id} className="studio-card">
                <Link href={`/studio/products/${product.id}`} className="studio-card__media">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={product.product_name}
                      fill
                      className="studio-card__image"
                      sizes="(max-width: 640px) 50vw, 220px"
                      unoptimized
                    />
                  ) : (
                    <div className="studio-card__image-fallback" aria-hidden />
                  )}
                  {!product.is_published && (
                    <span className="studio-card__badge">Draft</span>
                  )}
                  {product.is_discontinued && (
                    <span className="studio-card__badge studio-card__badge--warn">
                      Discontinued
                    </span>
                  )}
                </Link>
                <div className="studio-card__body">
                  <p className="studio-card__brand">
                    {product.brand || '—'} · {product.product_type_display || product.product_type}
                  </p>
                  <Link href={`/studio/products/${product.id}`} className="studio-card__name">
                    {product.product_name}
                  </Link>
                  {price && <p className="studio-card__price">{price}</p>}
                  <p className="studio-card__meta">
                    Stock {product.available_stock ?? '—'}
                    {typeof product.seo_score === 'number' ? ` · SEO ${product.seo_score}` : ''}
                  </p>
                  <div className="studio-card__actions">
                    <Link
                      href={`/studio/products/${product.id}`}
                      className="studio-btn studio-btn--small studio-btn--primary"
                    >
                      {capabilities.canFullEdit || capabilities.canContentEdit
                        ? 'Edit'
                        : 'Open'}
                    </Link>
                    {product.slug && (
                      <a
                        href={`/products/${product.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="studio-btn studio-btn--small studio-btn--ghost"
                      >
                        Shop view
                      </a>
                    )}
                    {capabilities.canDelete && (
                      <button
                        type="button"
                        className="studio-btn studio-btn--small studio-btn--danger"
                        disabled={deletingId === product.id}
                        onClick={() => void handleDelete(product)}
                      >
                        {deletingId === product.id ? '…' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="studio-pagination">
          <button
            type="button"
            className="studio-btn studio-btn--ghost"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="studio-btn studio-btn--ghost"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
