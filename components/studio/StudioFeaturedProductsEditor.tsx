'use client';

import { useCallback, useEffect, useState } from 'react';
import { OpenAPI } from '@/lib/api/generated';
import {
  ensureStudioFeaturedTag,
  listStudioProducts,
  setStudioProductFeatured,
  studioProductHasFeaturedTag,
  studioProductImageUrl,
  StudioApiError,
  type StudioProduct,
  type StudioTag,
} from '@/lib/studio/api';

type StudioFeaturedProductsEditorProps = {
  roleHint?: string;
  onSaved?: () => void | Promise<void>;
};

type ListedProduct = {
  id: number;
  product_name: string;
  image?: string | null;
};

async function fetchFeaturedForEditor(): Promise<ListedProduct[]> {
  const base = OpenAPI.BASE.replace(/\/+$/, '');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(typeof OpenAPI.HEADERS === 'function'
      ? await OpenAPI.HEADERS({} as never)
      : (OpenAPI.HEADERS ?? {})),
  };
  const res = await fetch(`${base}/api/v1/public/products/?featured=1&page_size=50&page=1`, {
    credentials: 'omit',
    headers,
  });
  if (!res.ok) throw new Error(`Featured products request failed: ${res.status}`);
  const data = await res.json();
  return ((data.results ?? []) as Array<{ id?: number; product_name?: string; primary_image?: string | null }>)
    .filter((p) => typeof p.id === 'number')
    .map((p) => ({
      id: p.id!,
      product_name: p.product_name || `Product #${p.id}`,
      image: p.primary_image || null,
    }));
}

export function StudioFeaturedProductsEditor({
  roleHint,
  onSaved,
}: StudioFeaturedProductsEditorProps) {
  const [featuredTag, setFeaturedTag] = useState<StudioTag | null>(null);
  const [featured, setFeatured] = useState<ListedProduct[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<StudioProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const refreshFeatured = useCallback(async () => {
    setFeatured(await fetchFeaturedForEditor());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const tag = await ensureStudioFeaturedTag();
        if (cancelled) return;
        setFeaturedTag(tag);
        await refreshFeatured();
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof StudioApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Could not load featured products'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshFeatured]);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const data = await listStudioProducts({ search: q, page: 1 });
          if (!cancelled) setResults(data.results ?? []);
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof StudioApiError
                ? err.message
                : err instanceof Error
                  ? err.message
                  : 'Search failed'
            );
          }
        } finally {
          if (!cancelled) setSearching(false);
        }
      })();
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search]);

  const toggle = async (productId: number, makeFeatured: boolean) => {
    setBusyId(productId);
    setError(null);
    setMsg(null);
    try {
      await setStudioProductFeatured(productId, makeFeatured, featuredTag?.id);
      await refreshFeatured();
      setMsg(makeFeatured ? 'Added to featured highlights' : 'Removed from featured highlights');
      await onSaved?.();
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Update failed'
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="studio-editor__hint">Loading featured products…</p>;
  }

  return (
    <div className="studio-editor">
      <div className="studio-editor__header">
        <h2 className="studio-editor__title">Featured Product Highlights</h2>
        <p className="studio-editor__hint">
          {roleHint ||
            'Products with the Featured tag appear in this homepage section (and /products?featured=1).'}
        </p>
      </div>

      {error && (
        <div className="studio-alert" role="alert">
          {error}
        </div>
      )}
      {msg && (
        <div className="studio-alert studio-alert--ok" role="status">
          {msg}
        </div>
      )}

      <section className="studio-featured-picker">
        <h3 className="studio-images__title">Currently featured ({featured.length})</h3>
        {featured.length === 0 ? (
          <p className="studio-images__empty">No featured products yet. Search below to add some.</p>
        ) : (
          <ul className="studio-featured-picker__list">
            {featured.map((product) => (
              <li key={product.id} className="studio-featured-picker__row">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt="" className="studio-featured-picker__thumb" />
                ) : (
                  <span className="studio-featured-picker__thumb studio-featured-picker__thumb--empty" />
                )}
                <span className="studio-featured-picker__name">{product.product_name}</span>
                <button
                  type="button"
                  className="studio-btn--ghost"
                  disabled={busyId === product.id}
                  onClick={() => void toggle(product.id, false)}
                >
                  {busyId === product.id ? '…' : 'Remove'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="studio-featured-picker">
        <h3 className="studio-images__title">Add products</h3>
        <label className="studio-field studio-field--full">
          <span>Search catalog</span>
          <input
            className="studio-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type at least 2 characters…"
          />
        </label>
        {searching && <p className="studio-editor__hint">Searching…</p>}
        <ul className="studio-featured-picker__list">
          {results.map((product) => {
            if (!product.id) return null;
            const isFeatured =
              featured.some((f) => f.id === product.id) ||
              studioProductHasFeaturedTag(product, featuredTag?.id);
            const image = studioProductImageUrl(product);
            return (
              <li key={product.id} className="studio-featured-picker__row">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="studio-featured-picker__thumb" />
                ) : (
                  <span className="studio-featured-picker__thumb studio-featured-picker__thumb--empty" />
                )}
                <span className="studio-featured-picker__name">
                  {product.product_name || `Product #${product.id}`}
                </span>
                <button
                  type="button"
                  className={isFeatured ? 'studio-btn--ghost' : 'studio-icon-btn studio-icon-btn--edit'}
                  disabled={busyId === product.id}
                  onClick={() => void toggle(product.id!, !isFeatured)}
                >
                  {busyId === product.id ? '…' : isFeatured ? 'Remove' : 'Add'}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
