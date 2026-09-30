'use client';

import { useEffect, useState } from 'react';
import {
  createStudioProductAccessory,
  deleteStudioProductAccessory,
  listStudioProductAccessories,
  listStudioProducts,
  StudioApiError,
  type StudioProduct,
  type StudioProductAccessoryLink,
} from '@/lib/studio/api';

type Props = {
  productId: number;
};

export function StudioProductAccessories({ productId }: Props) {
  const [links, setLinks] = useState<StudioProductAccessoryLink[]>([]);
  const [search, setSearch] = useState('');
  const [hits, setHits] = useState<StudioProduct[]>([]);
  const [qty, setQty] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLinks(await listStudioProductAccessories(productId));
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        await reload();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof StudioApiError ? err.message : 'Could not load accessories');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await listStudioProducts({ search: q, pageSize: 10 });
          if (!cancelled) setHits((data.results ?? []).filter((p) => p.id !== productId));
        } catch {
          if (!cancelled) setHits([]);
        }
      })();
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [search, productId]);

  const handleAdd = async (accessory: StudioProduct) => {
    setError(null);
    try {
      await createStudioProductAccessory({
        main_product: productId,
        accessory: accessory.id,
        required_quantity: Number(qty) || 1,
      });
      setSearch('');
      setHits([]);
      await reload();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Could not link accessory');
    }
  };

  const handleDelete = async (link: StudioProductAccessoryLink) => {
    if (!window.confirm('Remove this accessory link?')) return;
    try {
      await deleteStudioProductAccessory(link.id);
      await reload();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Delete failed');
    }
  };

  if (loading) return <p className="studio-editor__hint">Loading accessories…</p>;

  return (
    <section className="studio-editor__section">
      <h3 className="studio-editor__section-title">Accessories</h3>
      {error && (
        <div className="studio-alert" role="alert">
          {error}
        </div>
      )}
      <ul className="studio-hero-placement__list">
        {links.map((link) => (
          <li key={link.id}>
            <div className="studio-hero-placement__item" style={{ cursor: 'default' }}>
              <span className="studio-hero-placement__title">
                {link.accessory_name || `Product #${link.accessory}`} ×{link.required_quantity ?? 1}
              </span>
              <button type="button" className="studio-btn studio-btn--ghost" onClick={() => void handleDelete(link)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="studio-editor__grid" style={{ marginTop: '0.75rem' }}>
        <label className="studio-field studio-field--full">
          <span>Search accessory product</span>
          <input className="studio-input" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label className="studio-field">
          <span>Qty</span>
          <input className="studio-input" value={qty} onChange={(e) => setQty(e.target.value)} />
        </label>
      </div>
      {hits.length > 0 && (
        <ul className="studio-hero-placement__list">
          {hits.map((p) => (
            <li key={p.id}>
              <button type="button" className="studio-hero-placement__item" onClick={() => void handleAdd(p)}>
                <span className="studio-hero-placement__title">{p.product_name}</span>
                <span className="studio-icon-btn studio-icon-btn--edit">
                  <span>Link</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
