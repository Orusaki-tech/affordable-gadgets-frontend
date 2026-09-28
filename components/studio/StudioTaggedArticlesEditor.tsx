'use client';

import { useCallback, useEffect, useState } from 'react';
import { OpenAPI } from '@/lib/api/generated';
import {
  ensureStudioTag,
  listStudioArticles,
  resolveStudioImageUrl,
  setStudioArticleTagged,
  studioArticleHasTag,
  StudioApiError,
  type StudioArticle,
  type StudioTag,
} from '@/lib/studio/api';

type ListedArticle = {
  id: number;
  headline: string;
  image?: string | null;
  productName?: string | null;
};

type StudioTaggedArticlesEditorProps = {
  roleHint?: string;
  onSaved?: () => void | Promise<void>;
};

async function fetchFeaturedArticles(): Promise<ListedArticle[]> {
  const base = OpenAPI.BASE.replace(/\/+$/, '');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(typeof OpenAPI.HEADERS === 'function'
      ? await OpenAPI.HEADERS({} as never)
      : (OpenAPI.HEADERS ?? {})),
  };
  const res = await fetch(
    `${base}/api/v1/public/articles/?tag=featured&page_size=50&page=1`,
    { credentials: 'omit', headers }
  );
  if (!res.ok) throw new Error(`Featured articles request failed: ${res.status}`);
  const data = await res.json();
  return (
    (data.results ?? []) as Array<{
      id?: number;
      headline?: string;
      thumbnail_image?: string | null;
      product_primary_image?: string | null;
      product_name?: string | null;
    }>
  )
    .filter((a) => typeof a.id === 'number')
    .map((a) => ({
      id: a.id!,
      headline: a.headline || `Article #${a.id}`,
      image: a.thumbnail_image || a.product_primary_image || null,
      productName: a.product_name || null,
    }));
}

function articleThumb(article: StudioArticle): string | null {
  return resolveStudioImageUrl(article.thumbnail_image);
}

export function StudioTaggedArticlesEditor({
  roleHint,
  onSaved,
}: StudioTaggedArticlesEditorProps) {
  const [tag, setTag] = useState<StudioTag | null>(null);
  const [selected, setSelected] = useState<ListedArticle[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<StudioArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const refreshSelected = useCallback(async () => {
    setSelected(await fetchFeaturedArticles());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const ensured = await ensureStudioTag('Featured', 'featured');
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
                : 'Could not load featured articles'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSelected]);

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
          const data = await listStudioArticles({ search: q, page: 1 });
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

  const toggle = async (articleId: number, enabled: boolean) => {
    setBusyId(articleId);
    setError(null);
    setMsg(null);
    try {
      await setStudioArticleTagged(articleId, {
        tagName: 'Featured',
        tagSlug: 'featured',
        enabled,
        tagId: tag?.id,
      });
      await refreshSelected();
      setMsg(enabled ? 'Added (Featured tag)' : 'Removed (Featured tag)');
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
    return <p className="studio-editor__hint">Loading Tech Buying Guides…</p>;
  }

  return (
    <div className="studio-editor">
      <div className="studio-editor__header">
        <h2 className="studio-editor__title">Tech Buying Guides & Insights</h2>
        {roleHint ? <p className="studio-editor__hint">{roleHint}</p> : null}
        <p className="studio-editor__hint">
          Articles with the Featured tag appear in this homepage section. Browse below to add or
          remove.
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
        <h3 className="studio-images__title">Currently featured ({selected.length})</h3>
        {selected.length === 0 ? (
          <p className="studio-images__empty">
            No Featured articles yet. Search below and click Add.
          </p>
        ) : (
          <ul className="studio-featured-picker__list">
            {selected.map((article) => (
              <li key={article.id} className="studio-featured-picker__row">
                {article.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={article.image} alt="" className="studio-featured-picker__thumb" />
                ) : (
                  <span className="studio-featured-picker__thumb studio-featured-picker__thumb--empty" />
                )}
                <span className="studio-featured-picker__name">
                  {article.headline}
                  {article.productName ? (
                    <span className="studio-featured-picker__meta"> · {article.productName}</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  className="studio-btn--ghost"
                  disabled={busyId === article.id}
                  onClick={() => void toggle(article.id, false)}
                >
                  {busyId === article.id ? '…' : 'Remove'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="studio-featured-picker">
        <h3 className="studio-images__title">Search articles</h3>
        <label className="studio-field studio-field--full">
          <span className="sr-only">Search articles</span>
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
          {results.map((article) => {
            if (!article.id) return null;
            const isInSection =
              selected.some((f) => f.id === article.id) ||
              studioArticleHasTag(article, 'Featured', tag?.id);
            const image = articleThumb(article);
            return (
              <li key={article.id} className="studio-featured-picker__row">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="studio-featured-picker__thumb" />
                ) : (
                  <span className="studio-featured-picker__thumb studio-featured-picker__thumb--empty" />
                )}
                <span className="studio-featured-picker__name">
                  {article.headline || `Article #${article.id}`}
                  {article.product_name ? (
                    <span className="studio-featured-picker__meta"> · {article.product_name}</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  className={
                    isInSection ? 'studio-btn--ghost' : 'studio-icon-btn studio-icon-btn--edit'
                  }
                  disabled={busyId === article.id}
                  onClick={() => void toggle(article.id, !isInSection)}
                >
                  {busyId === article.id ? '…' : isInSection ? 'Remove' : 'Add'}
                </button>
              </li>
            );
          })}
        </ul>
        {search.trim().length >= 2 && !searching && results.length === 0 ? (
          <p className="studio-images__empty">No articles matched that search.</p>
        ) : null}
      </section>
    </div>
  );
}
