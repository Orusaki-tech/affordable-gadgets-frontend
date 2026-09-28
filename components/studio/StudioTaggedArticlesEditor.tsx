'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

function articleThumb(article: StudioArticle): string | null {
  return resolveStudioImageUrl(article.thumbnail_image);
}

function ArticleRow({
  id,
  headline,
  image,
  meta,
  featured,
  busy,
  onToggle,
}: {
  id: number;
  headline: string;
  image?: string | null;
  meta?: string | null;
  featured: boolean;
  busy: boolean;
  onToggle: (id: number, next: boolean) => void;
}) {
  return (
    <li className="studio-featured-picker__row">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="studio-featured-picker__thumb" />
      ) : (
        <span className="studio-featured-picker__thumb studio-featured-picker__thumb--empty" />
      )}
      <span className="studio-featured-picker__name">
        {headline}
        {meta ? <span className="studio-featured-picker__meta"> · {meta}</span> : null}
      </span>
      <button
        type="button"
        className={featured ? 'studio-btn--ghost' : 'studio-icon-btn studio-icon-btn--edit'}
        disabled={busy}
        onClick={() => onToggle(id, !featured)}
      >
        {busy ? '…' : featured ? 'Remove' : 'Feature'}
      </button>
    </li>
  );
}

export function StudioTaggedArticlesEditor({
  roleHint,
  onSaved,
}: StudioTaggedArticlesEditorProps) {
  const [tag, setTag] = useState<StudioTag | null>(null);
  const [selected, setSelected] = useState<ListedArticle[]>([]);
  const [catalog, setCatalog] = useState<StudioArticle[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadCatalog = useCallback(async (pageNum: number, append: boolean) => {
    const data = await listStudioArticles({
      page: pageNum,
      search: undefined,
      publishedOnly: true,
    });
    const rows = data.results ?? [];
    setCatalog((prev) => (append ? [...prev, ...rows] : rows));
    setHasNext(Boolean(data.next));
    setPage(pageNum);
  }, []);

  const refreshFeatured = useCallback(async () => {
    const data = await listStudioArticles({
      page: 1,
      publishedOnly: true,
      tag: 'featured',
    });
    setSelected(
      (data.results ?? [])
        .filter((a): a is StudioArticle & { id: number } => typeof a.id === 'number')
        .map((a) => ({
          id: a.id,
          headline: a.headline || `Article #${a.id}`,
          image: articleThumb(a),
          productName: a.product_name || null,
        }))
    );
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
        await Promise.all([refreshFeatured(), loadCatalog(1, false)]);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof StudioApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Could not load articles'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCatalog, refreshFeatured]);

  const selectedIds = useMemo(() => new Set(selected.map((a) => a.id)), [selected]);

  const filteredCatalog = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((article) => {
      const hay = `${article.headline || ''} ${article.product_name || ''} ${article.slug || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [catalog, filter]);

  const toggle = async (articleId: number, enabled: boolean) => {
    setBusyId(articleId);
    setError(null);
    setMsg(null);
    // Optimistic UI so Remove feels instant even before public list refreshes.
    if (!enabled) {
      setSelected((prev) => prev.filter((a) => a.id !== articleId));
    }
    try {
      const saved = await setStudioArticleTagged(articleId, {
        tagName: 'Featured',
        tagSlug: 'featured',
        enabled,
        tagId: tag?.id,
      });
      const stillTagged = studioArticleHasTag(saved, 'Featured', tag?.id);
      if (enabled && !stillTagged) {
        throw new Error('Could not add the Featured tag. Try again.');
      }
      if (!enabled && stillTagged) {
        throw new Error(
          'Could not remove the Featured tag. The article may still be tagged in admin.'
        );
      }
      if (enabled && saved.id) {
        setSelected((prev) => {
          if (prev.some((a) => a.id === saved.id)) return prev;
          return [
            ...prev,
            {
              id: saved.id!,
              headline: saved.headline || `Article #${saved.id}`,
              image: articleThumb(saved),
              productName: saved.product_name || null,
            },
          ];
        });
      } else if (!enabled) {
        setSelected((prev) => prev.filter((a) => a.id !== articleId));
      }
      setMsg(enabled ? 'Featured on homepage' : 'Removed from homepage');
      await onSaved?.();
    } catch (err) {
      await refreshFeatured().catch(() => undefined);
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

  const loadMore = async () => {
    setLoadingMore(true);
    setError(null);
    try {
      await loadCatalog(page + 1, true);
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not load more articles'
      );
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return <p className="studio-editor__hint">Loading blogs…</p>;
  }

  return (
    <div className="studio-editor studio-editor--flush">
      <div className="studio-editor__toolbar">
        <div>
          <p className="studio-editor__kicker">{roleHint || 'Homepage blogs'}</p>
          <h2 className="studio-editor__title studio-editor__title--compact">
            Choose featured blogs
          </h2>
          <p className="studio-editor__hint studio-editor__hint--tight">
            Featured blogs appear under Tech Buying Guides on the storefront. Close this panel to
            refresh the homepage preview.
          </p>
        </div>
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

      <section className="studio-editor__section">
        <h3 className="studio-editor__section-title">Currently featured ({selected.length})</h3>
        {selected.length === 0 ? (
          <p className="studio-images__empty">None yet. Pick blogs from the list below.</p>
        ) : (
          <ul className="studio-featured-picker__list">
            {selected.map((article) => (
              <ArticleRow
                key={article.id}
                id={article.id}
                headline={article.headline}
                image={article.image}
                meta={article.productName}
                featured
                busy={busyId === article.id}
                onToggle={toggle}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="studio-editor__section">
        <h3 className="studio-editor__section-title">All blogs</h3>
        <label className="studio-field studio-field--full">
          <span className="sr-only">Filter blogs</span>
          <input
            className="studio-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter listed blogs…"
            autoFocus
          />
        </label>
        <ul className="studio-featured-picker__list">
          {filteredCatalog.map((article) => {
            if (!article.id) return null;
            const featured =
              selectedIds.has(article.id) ||
              studioArticleHasTag(article, 'Featured', tag?.id);
            return (
              <ArticleRow
                key={article.id}
                id={article.id}
                headline={article.headline || `Article #${article.id}`}
                image={articleThumb(article)}
                meta={article.product_name}
                featured={featured}
                busy={busyId === article.id}
                onToggle={toggle}
              />
            );
          })}
        </ul>
        {filteredCatalog.length === 0 ? (
          <p className="studio-images__empty">No blogs match that filter.</p>
        ) : null}
        {hasNext && !filter.trim() ? (
          <button
            type="button"
            className="studio-btn studio-btn--ghost studio-btn--block"
            style={{ marginTop: '0.75rem' }}
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? 'Loading…' : 'Load more blogs'}
          </button>
        ) : null}
      </section>
    </div>
  );
}
