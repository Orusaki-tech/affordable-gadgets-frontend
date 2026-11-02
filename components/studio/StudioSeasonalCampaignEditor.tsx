'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  listStudioProducts,
  patchStudioHomepageCampaign,
  retrieveStudioHomepageCampaign,
  studioProductImageUrl,
  StudioApiError,
  type HomepageCampaignAnimation,
  type StudioHomepageCampaignProduct,
  type StudioProduct,
} from '@/lib/studio/api';

type StudioSeasonalCampaignEditorProps = {
  roleHint?: string;
  onSaved?: () => void | Promise<void>;
};

function toDatetimeLocal(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function StudioSeasonalCampaignEditor({
  roleHint,
  onSaved,
}: StudioSeasonalCampaignEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [title, setTitle] = useState('Black November');
  const [animation, setAnimation] = useState<HomepageCampaignAnimation>('none');
  const [isActive, setIsActive] = useState(true);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [selected, setSelected] = useState<StudioHomepageCampaignProduct[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<StudioProduct[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const campaign = await retrieveStudioHomepageCampaign();
        if (cancelled) return;
        setTitle(campaign.title || 'Black November');
        setAnimation(campaign.animation === 'title_shimmer' ? 'title_shimmer' : 'none');
        setIsActive(Boolean(campaign.is_active));
        setStartsAt(toDatetimeLocal(campaign.starts_at));
        setEndsAt(toDatetimeLocal(campaign.ends_at));
        setSelected(
          (campaign.products ?? [])
            .filter((product) => typeof product.id === 'number')
            .map((product) => ({
              id: product.id,
              product_name: product.product_name || `Product #${product.id}`,
              primary_image: product.primary_image || null,
            }))
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof StudioApiError ? err.message : 'Could not load the campaign');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const query = search.trim();
    if (query.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const data = await listStudioProducts({ search: query, page: 1 });
          if (!cancelled) setResults(data.results ?? []);
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof StudioApiError ? err.message : 'Search failed');
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

  const move = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= selected.length) return;
    setSelected((current) => {
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  };

  const addProduct = (product: StudioProduct) => {
    if (!product.id || selected.some((item) => item.id === product.id)) return;
    if (selected.length >= 24) {
      setError('Choose at most 24 products.');
      return;
    }
    setSelected((current) => [
      ...current,
      {
        id: product.id,
        product_name: product.product_name || `Product #${product.id}`,
        primary_image: studioProductImageUrl(product),
      },
    ]);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      const saved = await patchStudioHomepageCampaign({
        title: trimmed,
        animation,
        is_active: isActive,
        starts_at: fromDatetimeLocal(startsAt),
        ends_at: fromDatetimeLocal(endsAt),
        product_ids: selected.map((product) => product.id),
      });
      setTitle(saved.title);
      setSelected(
        (saved.products ?? []).map((product) => ({
          id: product.id,
          product_name: product.product_name || `Product #${product.id}`,
          primary_image: product.primary_image || null,
        }))
      );
      setMsg('Campaign saved. The homepage updates for shoppers when it is on and has products.');
      await onSaved?.();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="studio-editor__hint">Loading seasonal campaign…</p>;
  }

  return (
    <form className="studio-editor studio-editor--flush" onSubmit={(event) => void save(event)}>
      <div className="studio-editor__header">
        <h2 className="studio-editor__title">Seasonal campaign</h2>
        {roleHint ? <p className="studio-editor__hint">{roleHint}</p> : null}
        <p className="studio-editor__hint">
          This heading and product order appear above Special Offers. Turn it off, or leave it
          empty, and shoppers will not see the row. Featured tags are unchanged.
        </p>
      </div>

      {error ? (
        <div className="studio-alert" role="alert">
          {error}
        </div>
      ) : null}
      {msg ? (
        <div className="studio-alert studio-alert--ok" role="status">
          {msg}
        </div>
      ) : null}

      <label className="studio-field">
        <span>Title</span>
        <input
          className="studio-input"
          value={title}
          maxLength={80}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </label>

      <label className="studio-field">
        <span>Animation</span>
        <select
          className="studio-input"
          value={animation}
          onChange={(event) => setAnimation(event.target.value as HomepageCampaignAnimation)}
        >
          <option value="none">None</option>
          <option value="title_shimmer">Title shimmer</option>
        </select>
      </label>

      <label className="studio-field">
        <span>Visible on the shop</span>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
        />
      </label>

      <label className="studio-field">
        <span>Starts</span>
        <input
          className="studio-input"
          type="datetime-local"
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
        />
      </label>

      <label className="studio-field">
        <span>Ends</span>
        <input
          className="studio-input"
          type="datetime-local"
          value={endsAt}
          onChange={(event) => setEndsAt(event.target.value)}
        />
      </label>

      <section className="studio-featured-picker">
        <h3 className="studio-images__title">In this carousel ({selected.length})</h3>
        {selected.length === 0 ? (
          <p className="studio-images__empty">No products yet. Search the catalog below and add some.</p>
        ) : (
          <ul className="studio-featured-picker__list">
            {selected.map((product, index) => (
              <li key={product.id} className="studio-featured-picker__row">
                {product.primary_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.primary_image} alt="" className="studio-featured-picker__thumb" />
                ) : (
                  <span className="studio-featured-picker__thumb studio-featured-picker__thumb--empty" />
                )}
                <span className="studio-featured-picker__name">{product.product_name}</span>
                <button
                  type="button"
                  className="studio-btn--ghost studio-btn--compact"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="studio-btn--ghost studio-btn--compact"
                  disabled={index === selected.length - 1}
                  onClick={() => move(index, 1)}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="studio-btn--ghost"
                  onClick={() => setSelected((current) => current.filter((item) => item.id !== product.id))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="studio-featured-picker">
        <h3 className="studio-images__title">Search catalog</h3>
        <label className="studio-field studio-field--full">
          <span className="sr-only">Search products</span>
          <input
            className="studio-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Type at least 2 characters…"
          />
        </label>
        {searching ? <p className="studio-editor__hint">Searching…</p> : null}
        <ul className="studio-featured-picker__list">
          {results.map((product) => {
            if (!product.id) return null;
            const already = selected.some((item) => item.id === product.id);
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
                  className={already ? 'studio-btn--ghost' : 'studio-icon-btn studio-icon-btn--edit'}
                  disabled={already}
                  onClick={() => addProduct(product)}
                >
                  {already ? 'Added' : 'Add'}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="studio-editor__toolbar">
        <button type="submit" className="studio-icon-btn studio-icon-btn--edit" disabled={saving}>
          {saving ? 'Saving…' : 'Save campaign'}
        </button>
      </div>
    </form>
  );
}
