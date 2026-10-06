'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useStudioAuth } from '@/components/studio/StudioAuthContext';
import {
  createStudioReview,
  deleteStudioReview,
  listStudioProducts,
  listAllStudioReviews,
  patchStudioReview,
  StudioApiError,
  type StudioProduct,
  type StudioReview,
} from '@/lib/studio/api';

type StudioReviewsManagerProps = {
  roleHint?: string;
  preferProductId?: number | null;
  onSaved?: () => void;
};

export function StudioReviewsManager({
  roleHint,
  preferProductId,
  onSaved,
}: StudioReviewsManagerProps) {
  const { capabilities } = useStudioAuth();
  const canCreate = capabilities.canCreateReviews;
  const [reviews, setReviews] = useState<StudioReview[]>([]);
  const [editing, setEditing] = useState<StudioReview | null>(null);
  const [productId, setProductId] = useState(preferProductId ? String(preferProductId) : '');
  const [productLabel, setProductLabel] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productHits, setProductHits] = useState<StudioProduct[]>([]);
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = async () => {
    const rows = await listAllStudioReviews(
      preferProductId ? { product: preferProductId } : undefined
    );
    setReviews(rows);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        await reload();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof StudioApiError ? err.message : 'Could not load reviews');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferProductId]);

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

  const resetForm = () => {
    setEditing(null);
    setRating('5');
    setComment('');
    if (!preferProductId) {
      setProductId('');
      setProductLabel('');
    }
  };

  const startEdit = (review: StudioReview) => {
    setEditing(review);
    setProductId(String(review.product));
    setProductLabel(review.product_name || `Product #${review.product}`);
    setRating(String(review.rating));
    setComment(review.comment || '');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!editing && !canCreate) {
      setError('Only Content Creators can create reviews in Studio.');
      return;
    }
    if (!productId) {
      setError('Select a product.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await patchStudioReview(editing.id, {
          rating: Number(rating),
          comment: comment.trim(),
        });
        setMsg('Review updated.');
      } else {
        await createStudioReview({
          product: Number(productId),
          rating: Number(rating),
          comment: comment.trim(),
        });
        setMsg('Review created.');
        resetForm();
      }
      await reload();
      onSaved?.();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (review: StudioReview) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteStudioReview(review.id);
      if (editing?.id === review.id) resetForm();
      await reload();
      setMsg('Review deleted.');
      onSaved?.();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Delete failed');
    }
  };

  if (loading) return <p className="studio-editor__hint">Loading reviews…</p>;

  return (
    <div className="studio-editor studio-editor--flush">
      <div className="studio-editor__toolbar">
        <div>
          <p className="studio-editor__kicker">{roleHint || 'Reviews'}</p>
          <h2 className="studio-editor__title studio-editor__title--compact">
            {editing ? 'Edit review' : canCreate ? 'Create review' : 'Moderate reviews'}
          </h2>
        </div>
        {editing && canCreate && (
          <button type="button" className="studio-btn studio-btn--ghost" onClick={resetForm}>
            New review
          </button>
        )}
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

      {(editing || canCreate) && (
        <form className="studio-editor__section" onSubmit={handleSubmit}>
          {!editing && (
            <>
              <label className="studio-field">
                <span>Product {productLabel ? `· ${productLabel}` : ''}</span>
                <input
                  className="studio-input"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search product…"
                  disabled={Boolean(preferProductId)}
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
                          setProductId(String(p.id));
                          setProductLabel(p.product_name);
                          setProductSearch('');
                          setProductHits([]);
                        }}
                      >
                        <span className="studio-hero-placement__title">{p.product_name}</span>
                        <span className="studio-icon-btn studio-icon-btn--edit">
                          <span>Select</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          <label className="studio-field">
            <span>Rating (1–5)</span>
            <input
              className="studio-input"
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              required
            />
          </label>
          <label className="studio-field">
            <span>Comment</span>
            <textarea
              className="studio-textarea"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="studio-btn studio-btn--primary studio-btn--block" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save review' : 'Create review'}
          </button>
        </form>
      )}

      <section className="studio-editor__section">
        <h3 className="studio-editor__section-title">Reviews ({reviews.length})</h3>
        <ul className="studio-hero-placement__list">
          {reviews.map((review) => (
            <li key={review.id}>
              <div className="studio-hero-placement__item" style={{ cursor: 'default' }}>
                <span className="studio-hero-placement__title">
                  ★{review.rating} · {review.product_name || `#${review.product}`} —{' '}
                  {(review.comment || '').slice(0, 60)}
                </span>
                <button type="button" className="studio-icon-btn studio-icon-btn--edit" onClick={() => startEdit(review)}>
                  <span>Edit</span>
                </button>
                <button type="button" className="studio-btn studio-btn--ghost" onClick={() => void handleDelete(review)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
