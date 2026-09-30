'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createStudioArticle,
  deleteStudioArticle,
  listStudioProducts,
  patchStudioArticle,
  resolveStudioImageUrl,
  StudioApiError,
  type StudioArticle,
  type StudioProduct,
} from '@/lib/studio/api';

const ARTICLE_CATEGORIES = [
  { value: 'buying_guide', label: 'Buying guide' },
  { value: 'history_guide', label: 'History guide' },
  { value: 'informational_guide', label: 'Informational guide' },
  { value: 'tech_tip', label: 'Tech tip' },
  { value: 'news', label: 'News' },
  { value: 'general', label: 'General' },
] as const;

type StudioArticleEditorProps = {
  mode?: 'create' | 'edit';
  article?: StudioArticle | null;
  onSaved?: (article: StudioArticle) => void;
  onDeleted?: () => void;
};

function linkedProductIds(article?: StudioArticle | null): number[] {
  const raw = article?.products;
  if (!Array.isArray(raw)) {
    return typeof article?.product === 'number' ? [article.product] : [];
  }
  return raw
    .map((p) => (typeof p === 'number' ? p : p?.id))
    .filter((id): id is number => typeof id === 'number');
}

export function StudioArticleEditor({
  mode = 'edit',
  article = null,
  onSaved,
  onDeleted,
}: StudioArticleEditorProps) {
  const isCreate = mode === 'create' || !article?.id;
  const [headline, setHeadline] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('buying_guide');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [body, setBody] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isPrimary, setIsPrimary] = useState(false);
  const [productIds, setProductIds] = useState<number[]>([]);
  const [productLabels, setProductLabels] = useState<Record<number, string>>({});
  const [productSearch, setProductSearch] = useState('');
  const [productHits, setProductHits] = useState<StudioProduct[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHeadline(article?.headline || '');
    setSlug(article?.slug || '');
    setCategory(article?.category || 'buying_guide');
    setSeoTitle(article?.seo_title || '');
    setSeoDescription(article?.seo_description || '');
    setBody(article?.body || '');
    setIsPublished(article?.is_published ?? true);
    setIsPrimary(article?.is_primary ?? false);
    const ids = linkedProductIds(article);
    setProductIds(ids);
    const labels: Record<number, string> = {};
    if (Array.isArray(article?.products)) {
      for (const p of article.products) {
        if (typeof p === 'object' && p?.id) {
          labels[p.id] = p.product_name || `Product #${p.id}`;
        }
      }
    }
    if (article?.product && article.product_name) {
      labels[article.product] = article.product_name;
    }
    setProductLabels(labels);
    setThumbnailFile(null);
    setThumbnailPreview(null);
  }, [article]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  useEffect(() => {
    const q = productSearch.trim();
    if (q.length < 2) {
      setProductHits([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await listStudioProducts({ search: q, pageSize: 10 });
          if (!cancelled) setProductHits(data.results ?? []);
        } catch {
          if (!cancelled) setProductHits([]);
        }
      })();
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [productSearch]);

  const currentThumb =
    thumbnailPreview || resolveStudioImageUrl(article?.thumbnail_image);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: Record<string, string | Blob | boolean | number | null | undefined | number[]> =
        {
          headline: headline.trim(),
          slug: slug.trim(),
          category,
          seo_title: seoTitle.trim(),
          seo_description: seoDescription.trim(),
          body,
          is_published: isPublished,
          is_primary: isPrimary,
          product_ids: productIds,
          product_id: productIds[0] ?? null,
        };
      if (thumbnailFile) payload.thumbnail_image = thumbnailFile;
      const saved = isCreate
        ? await createStudioArticle(payload)
        : await patchStudioArticle(article!.id, payload);
      onSaved?.(saved);
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Save failed'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!article?.id || !window.confirm('Delete this article?')) return;
    try {
      await deleteStudioArticle(article.id);
      onDeleted?.();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Delete failed');
    }
  };

  return (
    <form className="studio-editor" onSubmit={handleSubmit}>
      <div className="studio-editor__header">
        <h2 className="studio-editor__title">{isCreate ? 'Create article' : 'Edit article'}</h2>
      </div>
      <label className="studio-field">
        <span>Headline</span>
        <input value={headline} onChange={(e) => setHeadline(e.target.value)} required />
      </label>
      <label className="studio-field">
        <span>Slug</span>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} required />
      </label>
      <label className="studio-field">
        <span>Category</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {ARTICLE_CATEGORIES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label className="studio-field">
        <span>SEO title</span>
        <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
      </label>
      <label className="studio-field">
        <span>SEO description</span>
        <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={3} />
      </label>
      <label className="studio-field">
        <span>Body (markdown)</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} />
      </label>

      <section className="studio-editor__section">
        <h3 className="studio-editor__section-title">Linked products</h3>
        <label className="studio-field">
          <span>Search products</span>
          <input
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Add product links…"
          />
        </label>
        {productHits.length > 0 && (
          <ul className="studio-hero-placement__list">
            {productHits.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="studio-hero-placement__item"
                  onClick={() => {
                    setProductIds((prev) => (prev.includes(p.id) ? prev : [...prev, p.id]));
                    setProductLabels((prev) => ({ ...prev, [p.id]: p.product_name }));
                    setProductSearch('');
                    setProductHits([]);
                  }}
                >
                  <span className="studio-hero-placement__title">{p.product_name}</span>
                  <span className="studio-icon-btn studio-icon-btn--edit">
                    <span>Add</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {productIds.length > 0 && (
          <ul className="studio-chip-grid" style={{ marginTop: '0.5rem' }}>
            {productIds.map((id) => (
              <li key={id} style={{ listStyle: 'none' }}>
                <button
                  type="button"
                  className="studio-chip is-on"
                  onClick={() => setProductIds((prev) => prev.filter((pid) => pid !== id))}
                >
                  <span className="studio-chip__label">{productLabels[id] || `#${id}`}</span>
                  <span className="studio-chip__hint">Remove</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="studio-images studio-images--single">
        <div className="studio-images__head">
          <h3 className="studio-images__title">Thumbnail</h3>
          <label className="studio-btn studio-btn--ghost studio-images__upload">
            {thumbnailFile ? 'Change image' : 'Upload image'}
            <input
              type="file"
              accept="image/*"
              disabled={saving}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
                setThumbnailFile(file);
                setThumbnailPreview(file ? URL.createObjectURL(file) : null);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {currentThumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentThumb} alt="" className="studio-images__preview" />
        ) : (
          <div className="studio-dropzone">Upload a thumbnail</div>
        )}
      </div>

      <label className="studio-field studio-field--checkbox">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        <span>Published</span>
      </label>
      <label className="studio-field studio-field--checkbox">
        <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
        <span>Primary for linked product</span>
      </label>

      {error && (
        <div className="studio-alert" role="alert">
          {error}
        </div>
      )}
      <button type="submit" className="studio-btn studio-btn--primary" disabled={saving}>
        {saving ? 'Saving…' : isCreate ? 'Create article' : 'Save article'}
      </button>
      {!isCreate && article?.id && (
        <button type="button" className="studio-btn studio-btn--ghost" onClick={() => void handleDelete()}>
          Delete article
        </button>
      )}
    </form>
  );
}
