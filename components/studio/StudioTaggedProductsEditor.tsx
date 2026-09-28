'use client';

import { useCallback, useEffect, useState } from 'react';
import { OpenAPI } from '@/lib/api/generated';
import {
  ensureStudioTag,
  listStudioProducts,
  setStudioProductTagged,
  studioProductHasTag,
  studioProductImageUrl,
  StudioApiError,
  type StudioProduct,
  type StudioTag,
} from '@/lib/studio/api';

export type StudioSectionTagKey = 'featured' | 'video';

export type StudioTaggedSectionConfig = {
  key: StudioSectionTagKey;
  tagName: string;
  tagSlug: string;
  listQuery: string;
  title: string;
  description: string;
  currentHeading: string;
  searchLabel: string;
  emptySelected: string;
};

export const STUDIO_SECTION_TAGS: Record<StudioSectionTagKey, StudioTaggedSectionConfig> = {
  featured: {
    key: 'featured',
    tagName: 'Featured',
    tagSlug: 'featured',
    listQuery: 'featured=1&page_size=50&page=1',
    title: 'Featured Product Highlights',
    description:
      'Products with the Featured tag appear here and on /products?featured=1.',
    currentHeading: 'Currently featured',
    searchLabel: 'Search catalog',
    emptySelected: 'Nothing featured yet. Search the catalog below and click Add.',
  },
  video: {
    key: 'video',
    tagName: 'Video',
    tagSlug: 'video',
    listQuery: 'homepage_videos=1&page_size=50&page=1',
    title: 'Verified Tech Unboxings',
    description:
      'Products with the Video tag (and a product video) appear in this homepage section.',
    currentHeading: 'Currently in videos',
    searchLabel: 'Search catalog',
    emptySelected:
      'No video products yet. Search below and add products that have (or will have) videos.',
  },
};

type ListedProduct = {
  id: number;
  product_name: string;
  image?: string | null;
};

type StudioTaggedProductsEditorProps = {
  section: StudioSectionTagKey;
  roleHint?: string;
  onSaved?: () => void | Promise<void>;
};

async function fetchSectionProducts(listQuery: string): Promise<ListedProduct[]> {
  const base = OpenAPI.BASE.replace(/\/+$/, '');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(typeof OpenAPI.HEADERS === 'function'
      ? await OpenAPI.HEADERS({} as never)
      : (OpenAPI.HEADERS ?? {})),
  };
  const res = await fetch(`${base}/api/v1/public/products/?${listQuery}`, {
    credentials: 'omit',
    headers,
  });
  if (!res.ok) throw new Error(`Section products request failed: ${res.status}`);
  const data = await res.json();
  return (
    (data.results ?? []) as Array<{
      id?: number;
      product_name?: string;
      primary_image?: string | null;
    }>
  )
    .filter((p) => typeof p.id === 'number')
    .map((p) => ({
      id: p.id!,
      product_name: p.product_name || `Product #${p.id}`,
      image: p.primary_image || null,
    }));
}

export function StudioTaggedProductsEditor({
  section,
  roleHint,
  onSaved,
}: StudioTaggedProductsEditorProps) {
  const config = STUDIO_SECTION_TAGS[section];
  const [tag, setTag] = useState<StudioTag | null>(null);
  const [selected, setSelected] = useState<ListedProduct[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<StudioProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const refreshSelected = useCallback(async () => {
    setSelected(await fetchSectionProducts(config.listQuery));
  }, [config.listQuery]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const ensured = await ensureStudioTag(config.tagName, config.tagSlug);
        if (cancelled) return;
        setTag(ensured);
        await refreshSelected();
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof StudioApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Could not load section products'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.tagName, config.tagSlug, refreshSelected]);

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

  const toggle = async (productId: number, enabled: boolean) => {
    setBusyId(productId);
    setError(null);
    setMsg(null);
    try {
      await setStudioProductTagged(productId, {
        tagName: config.tagName,
        tagSlug: config.tagSlug,
        enabled,
        tagId: tag?.id,
      });
      await refreshSelected();
      setMsg(enabled ? `Added (${config.tagName} tag)` : `Removed (${config.tagName} tag)`);
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
    return <p className="studio-editor__hint">Loading {config.title}…</p>;
  }

  return (
    <div className="studio-editor">
      <div className="studio-editor__header">
        <h2 className="studio-editor__title">{config.title}</h2>
        {roleHint ? <p className="studio-editor__hint">{roleHint}</p> : null}
        <p className="studio-editor__hint">{config.description}</p>
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
        <h3 className="studio-images__title">
          {config.currentHeading} ({selected.length})
        </h3>
        {selected.length === 0 ? (
          <p className="studio-images__empty">{config.emptySelected}</p>
        ) : (
          <ul className="studio-featured-picker__list">
            {selected.map((product) => (
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
        <h3 className="studio-images__title">{config.searchLabel}</h3>
        <label className="studio-field studio-field--full">
          <span className="sr-only">Search products</span>
          <input
            className="studio-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type at least 2 characters…"
            autoFocus
          />
        </label>
        {searching && <p className="studio-editor__hint">Searching…</p>}
        <ul className="studio-featured-picker__list">
          {results.map((product) => {
            if (!product.id) return null;
            const isInSection =
              selected.some((f) => f.id === product.id) ||
              studioProductHasTag(product, config.tagName, tag?.id);
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
                  className={
                    isInSection ? 'studio-btn--ghost' : 'studio-icon-btn studio-icon-btn--edit'
                  }
                  disabled={busyId === product.id}
                  onClick={() => void toggle(product.id!, !isInSection)}
                >
                  {busyId === product.id ? '…' : isInSection ? 'Remove' : 'Add'}
                </button>
              </li>
            );
          })}
        </ul>
        {search.trim().length >= 2 && !searching && results.length === 0 ? (
          <p className="studio-images__empty">No products matched that search.</p>
        ) : null}
      </section>
    </div>
  );
}

/** Back-compat wrapper for Featured section. */
export function StudioFeaturedProductsEditor(props: {
  roleHint?: string;
  onSaved?: () => void | Promise<void>;
}) {
  return <StudioTaggedProductsEditor section="featured" {...props} />;
}
